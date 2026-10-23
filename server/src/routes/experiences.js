import { Router } from "express";
import PlacementExperience from "../models/PlacementExperience.js";
import Company from "../models/Company.js";
import Student from "../models/Student.js";
import { requireDb } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { logAction } from "../services/auditLogger.js";

const router = Router();

router.use(requireDb);

// GET /api/experiences — list with optional filters.
//   ?companyId=<id>   filter by company
//   ?outcome=<value>  filter by outcome enum
//   ?status=<value>   filter by moderationStatus (admin only)
//   ?page=<n>         page number (default 1)
//   ?limit=<n>        page size (default 50, max 100)
// Public visitors and students only see approved experiences.
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.companyId) filter.company = req.query.companyId;
    if (req.query.outcome) filter.outcome = req.query.outcome;

    const isAdmin = req.studentRole === "admin" || req.studentRole === "super_admin";
    if (req.query.status && isAdmin) {
      filter.moderationStatus = req.query.status;
    } else if (req.query.status && !isAdmin) {
      filter.moderationStatus = "approved";
    } else if (!isAdmin) {
      filter.moderationStatus = "approved";
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [experiences, total] = await Promise.all([
      PlacementExperience.find(filter)
        .populate("company", "name industry headquarters")
        .sort({ postedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PlacementExperience.countDocuments(filter),
    ]);

    res.json({
      count: experiences.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      experiences,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/experiences/:id — single experience with company populated.
// Non-admins can only view approved experiences.
router.get("/:id", async (req, res, next) => {
  try {
    const exp = await PlacementExperience.findById(req.params.id)
      .populate("company", "name industry headquarters")
      .lean();
    if (!exp) return res.status(404).json({ error: "Experience not found" });

    const isAdmin = req.studentRole === "admin" || req.studentRole === "super_admin";
    if (!isAdmin && exp.moderationStatus !== "approved") {
      return res.status(404).json({ error: "Experience not found" });
    }

    res.json({ experience: exp });
  } catch (err) {
    next(err);
  }
});

// POST /api/experiences — submit a placement experience (auth required).
// New submissions always have moderationStatus = "pending".
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { companyId, studentName, role, package: pkg, outcome, difficulty, overallExperience, tips, rounds } = req.body;

    if (!companyId || !studentName || !role) {
      return res.status(400).json({ error: "companyId, studentName, and role are required." });
    }

    const company = await Company.findById(companyId).lean();
    if (!company) return res.status(400).json({ error: "Company not found." });

    const validOutcomes = ["offered", "rejected", "in-progress", "withdrawn"];
    if (outcome && !validOutcomes.includes(outcome)) {
      return res.status(400).json({ error: "Invalid outcome value." });
    }

    const validDifficulties = ["easy", "medium", "hard"];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return res.status(400).json({ error: "Invalid difficulty value." });
    }

    let normalizedRounds = [];
    if (Array.isArray(rounds)) {
      normalizedRounds = rounds.map((r) => ({
        name: r.name || "",
        type: r.type || "other",
        details: r.details || "",
        difficulty: validDifficulties.includes(r.difficulty) ? r.difficulty : "medium",
        questions: Array.isArray(r.questions) ? r.questions : [],
        questionsAsked: Array.isArray(r.questionsAsked) ? r.questionsAsked : (Array.isArray(r.questions) ? r.questions : []),
      }));
    }

    const doc = {
      student: req.studentId || null,
      company: companyId,
      studentName,
      role,
      package: pkg || "",
      outcome: outcome || "in-progress",
      difficulty: difficulty || "medium",
      overallExperience: overallExperience || "",
      tips: tips || "",
      rounds: normalizedRounds,
      moderationStatus: "pending",
    };

    const created = await PlacementExperience.create(doc);
    const populated = await PlacementExperience.findById(created._id)
      .populate("company", "name industry headquarters")
      .lean();

    res.status(201).json({ experience: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "An experience for this company and student already exists." });
    }
    next(err);
  }
});

// PUT /api/experiences/:id/moderate — approve or reject a submission (admin only)
//   body: { status: "approved" | "rejected", rejectionReason?: string }
router.put("/:id/moderate", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body || {};
    const validStatuses = ["approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "status must be 'approved' or 'rejected'." });
    }

    const update = {
      moderationStatus: status,
      moderatedBy: req.studentId,
      moderatedAt: new Date(),
    };
    if (status === "rejected") {
      update.rejectionReason = (rejectionReason || "").trim();
    } else {
      update.rejectionReason = "";
    }

    const exp = await PlacementExperience.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    )
      .populate("company", "name industry headquarters")
      .lean();

    if (!exp) return res.status(404).json({ error: "Experience not found." });

    await logAction({
      actor: req.studentId,
      actorName: req.studentName || "",
      actorRole: req.studentRole,
      action: `moderate_experience_${status}`,
      resource: "PlacementExperience",
      resourceId: exp._id,
      details: `${status === "approved" ? "Approved" : "Rejected"} experience by ${exp.studentName} for ${exp.company?.name || "company"}${status === "rejected" && rejectionReason ? ` — reason: ${rejectionReason}` : ""}`,
    });

    res.json({ experience: exp });
  } catch (err) {
    next(err);
  }
});

export default router;
