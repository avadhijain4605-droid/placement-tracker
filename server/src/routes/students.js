import { Router } from "express";
import Student from "../models/Student.js";
import { requireDb } from "../config/db.js";

const router = Router();

router.use(requireDb);

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
