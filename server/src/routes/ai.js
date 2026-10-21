import { Router } from "express";
import Student from "../models/Student.js";
import Company from "../models/Company.js";
import { requireDb } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { generatePreparationPlan } from "../services/gemini.js";

const router = Router();

const MIN_PROFILE_FIELDS = ["skills", "graduationYear"];

router.use(requireDb, requireAuth);

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
