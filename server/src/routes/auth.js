import { Router } from "express";
import bcrypt from "bcryptjs";
import Student from "../models/Student.js";
import { requireDb } from "../config/db.js";
import { signToken } from "../middleware/auth.js";

const router = Router();

router.use(requireDb);

router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    const existing = await Student.findOne({ email: String(email).toLowerCase() });
    if (existing) return res.status(409).json({ error: "An account with that email already exists." });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const student = await Student.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash,
    });
    const token = signToken(student._id);
    res.status(201).json({ token, student: student.toJSON() });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const student = await Student.findOne({ email: String(email).toLowerCase() }).select("+passwordHash");
    if (!student) return res.status(401).json({ error: "Invalid email or password." });
    const ok = await bcrypt.compare(String(password), student.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password." });
    const token = signToken(student._id);
    res.json({ token, student: student.toJSON() });
  } catch (err) {
    next(err);
  }
});

export default router;
