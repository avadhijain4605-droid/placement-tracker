import { Router } from "express";
import Student from "../models/Student.js";
import { requireDb } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireDb);

const ALLOWED_FIELDS = [
  "college",
  "graduationYear",
  "cgpa",
  "skills",
  "projects",
  "certifications",
  "codingProfiles",
];

// All student routes require authentication.
router.use(requireAuth);

router.put("/me", async (req, res, next) => {
  try {
    const update = {};
    for (const f of ALLOWED_FIELDS) {
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, f)) {
        update[f] = req.body[f];
      }
    }
    if (Object.prototype.hasOwnProperty.call(update, "graduationYear")) {
      const y = Number(update.graduationYear);
      if (!Number.isFinite(y) || y < 2000 || y > 2100) {
        return res.status(400).json({ error: "graduationYear must be between 2000 and 2100." });
      }
      update.graduationYear = y;
    }
    if (Object.prototype.hasOwnProperty.call(update, "cgpa")) {
      const c = Number(update.cgpa);
      if (!Number.isFinite(c) || c < 0 || c > 10) {
        return res.status(400).json({ error: "cgpa must be between 0 and 10." });
      }
      update.cgpa = c;
    }
    if (Object.prototype.hasOwnProperty.call(update, "skills")) {
      if (!Array.isArray(update.skills)) {
        return res.status(400).json({ error: "skills must be an array of strings." });
      }
      update.skills = update.skills.map((s) => String(s).trim()).filter(Boolean);
    }

    const student = await Student.findByIdAndUpdate(
      req.studentId,
      { $set: update },
      { new: true, runValidators: true }
    ).select({ passwordHash: 0 });

    if (!student) return res.status(404).json({ error: "Student not found." });
    res.json({ student });
  } catch (err) {
    next(err);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const student = await Student.findById(req.studentId, { passwordHash: 0 }).lean();
    if (!student) return res.status(404).json({ error: "Student not found." });
    res.json({ student });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const students = await Student.find({}, { passwordHash: 0 }).sort({ name: 1 }).lean();
    res.json({ count: students.length, students });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id, { passwordHash: 0 }).lean();
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json({ student });
  } catch (err) {
    next(err);
  }
});

export default router;
