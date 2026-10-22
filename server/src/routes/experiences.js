import { Router } from "express";
import PlacementExperience from "../models/PlacementExperience.js";
import Company from "../models/Company.js";
import { requireDb } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireDb);

// GET /api/experiences — list with optional filters.
//   ?companyId=<id>   filter by company
//   ?outcome=<value>  filter by outcome enum
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.companyId) filter.company = req.query.companyId;
    if (req.query.outcome) filter.outcome = req.query.outcome;

    const experiences = await PlacementExperience.find(filter)
      .populate("company", "name industry headquarters")
      .sort({ postedAt: -1 })
      .lean();
    res.json({ count: experiences.length, experiences });
  } catch (err) {
    next(err);
  }
});

// GET /api/experiences/:id — single experience with company populated.
router.get("/:id", async (req, res, next) => {
  try {
    const exp = await PlacementExperience.findById(req.params.id)
      .populate("company", "name industry headquarters")
      .lean();
    if (!exp) return res.status(404).json({ error: "Experience not found" });
    res.json({ experience: exp });
  } catch (err) {
    next(err);
  }
});

// POST /api/experiences — submit a placement experience (auth required).
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { companyId, studentName, role, package: pkg, outcome, difficulty, overallExperience, tips, rounds } = req.body;

    if (!companyId || !studentName || !role) {
      return res.status(400).json({ error: "companyId, studentName, and role are required." });
    }

    // Validate that the company exists.
    const company = await Company.findById(companyId).lean();
    if (!company) return res.status(400).json({ error: "Company not found." });

    // Validate outcome enum if provided.
    const validOutcomes = ["offered", "rejected", "in-progress", "withdrawn"];
    if (outcome && !validOutcomes.includes(outcome)) {
      return res.status(400).json({ error: "Invalid outcome value." });
    }

    // Validate difficulty enum if provided.
    const validDifficulties = ["easy", "medium", "hard"];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return res.status(400).json({ error: "Invalid difficulty value." });
    }

    // Normalize rounds: accept questionsAsked or questions.
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

export default router;
