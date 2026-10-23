import { Router } from "express";
import Student from "../models/Student.js";
import Company from "../models/Company.js";
import PrepProgress from "../models/PrepProgress.js";
import { requireDb } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { generatePreparationPlan } from "../services/gemini.js";
import { analyzeSkillGap } from "../services/skillGap.js";

const router = Router();

const MIN_PROFILE_FIELDS = ["skills", "graduationYear"];

router.use(requireDb, requireAuth);

// POST /api/ai/skill-gap — deterministic skill-gap analysis (no AI call).
// Persists the analysis as a PrepProgress document so the dashboard can show it.
router.post("/skill-gap", async (req, res, next) => {
  try {
    const { companyId } = req.body || {};

    if (!companyId || typeof companyId !== "string") {
      return res.status(400).json({ error: "companyId is required." });
    }

    const student = await Student.findById(req.studentId, { passwordHash: 0 }).lean();
    if (!student) return res.status(404).json({ error: "Student not found." });

    const company = await Company.findById(companyId).lean();
    if (!company) return res.status(404).json({ error: "Company not found." });

    const analysis = analyzeSkillGap(student, company);

    // Persist as PrepProgress (upsert).
    const tasks = analysis.prepTasks.map((t) => ({
      skill: t.skill,
      priority: t.priority,
      reason: t.reason,
      done: false,
    }));

    const progressDoc = await PrepProgress.findOneAndUpdate(
      { studentId: req.studentId, companyId },
      {
        $set: {
          matched: analysis.matched,
          missing: analysis.missing,
          eligibility: analysis.eligibility,
          eligibilityPassed: analysis.eligibilityPassed,
          readiness: analysis.readiness,
          readinessFormula: analysis.readinessFormula,
          tasks,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({ analysis, progressId: progressDoc._id });
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/progress — list all prep-progress docs for the authenticated student.
router.get("/progress", async (req, res, next) => {
  try {
    const docs = await PrepProgress.find({ studentId: req.studentId })
      .populate("companyId", "name industry")
      .lean();
    res.json({ count: docs.length, progress: docs });
  } catch (err) {
    next(err);
  }
});

// PUT /api/ai/progress/:id/toggle — toggle a prep task's done status.
router.put("/progress/:id/toggle", async (req, res, next) => {
  try {
    const { taskId } = req.body || {};
    if (!taskId || typeof taskId !== "string") {
      return res.status(400).json({ error: "taskId is required." });
    }

    const doc = await PrepProgress.findOne({
      _id: req.params.id,
      studentId: req.studentId,
    });
    if (!doc) return res.status(404).json({ error: "Progress record not found." });

    const task = doc.tasks.id(taskId);
    if (!task) return res.status(404).json({ error: "Task not found." });

    task.done = !task.done;
    await doc.save();

    res.json({ task: { _id: task._id, skill: task.skill, done: task.done } });
  } catch (err) {
    next(err);
  }
});

// POST /api/preparation-plan — AI-generated preparation plan (existing route).
router.post("/preparation-plan", async (req, res, next) => {
  try {
    const { companyId, availableDays } = req.body || {};

    if (!companyId || typeof companyId !== "string") {
      return res.status(400).json({ error: "companyId is required." });
    }
    const days = Number.parseInt(availableDays, 10);
    if (!Number.isFinite(days) || days < 1 || days > 60) {
      return res.status(400).json({ error: "availableDays must be an integer between 1 and 60." });
    }

    const student = await Student.findById(req.studentId, { passwordHash: 0 }).lean();
    if (!student) return res.status(404).json({ error: "Student not found." });

    const missing = MIN_PROFILE_FIELDS.filter((f) => {
      const v = student[f];
      return v === undefined || v === null || (Array.isArray(v) && v.length === 0) || v === "";
    });
    if (missing.length) {
      return res.status(400).json({
        error: `Your profile is incomplete. Please fill in: ${missing.join(", ")}.`,
        missing,
      });
    }

    const company = await Company.findById(companyId).lean();
    if (!company) return res.status(404).json({ error: "Company not found." });

    let plan;
    try {
      plan = await generatePreparationPlan(student, company, days);
    } catch (err) {
      if (err.code === "GEMINI_NOT_CONFIGURED") return res.status(503).json({ error: err.message });
      if (err.code === "GEMINI_RATE_LIMIT") return res.status(429).json({ error: err.message });
      if (err.code === "GEMINI_BAD_INPUT") return res.status(502).json({ error: err.message });
      if (err.code === "GEMINI_INVALID_OUTPUT") {
        return res.status(502).json({ error: "The AI returned an invalid plan. Please try again." });
      }
      throw err;
    }

    res.json({ plan });
  } catch (err) {
    next(err);
  }
});

export default router;
