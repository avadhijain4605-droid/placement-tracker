import { Router } from "express";
import bcrypt from "bcryptjs";
import Student from "../models/Student.js";
import { requireDb } from "../config/db.js";
import { signToken, requireAuth, requireRole, TOKEN_COOKIE } from "../middleware/auth.js";

const router = Router();

router.use(requireDb);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[\p{L}\p{M}'.\- ]{1,80}$/u;

function isSecure(req) {
  // Respect proxy headers (x-forwarded-proto) when behind a load balancer
  if (req.secure) return true;
  const xfProto = req.headers["x-forwarded-proto"];
  return Array.isArray(xfProto) ? xfProto.includes("https") : xfProto === "https";
}

function setSessionCookie(res, token, req) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isSecure(req),
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearSessionCookie(res) {
  res.clearCookie(TOKEN_COOKIE, { httpOnly: true, sameSite: "strict", path: "/" });
}

/**
 * POST /api/auth/signup
 * Validates input, prevents duplicate accounts, hashes the password with
 * bcrypt (10 rounds), creates the student with the default "student" role
 * (the role is NEVER accepted from the request body), and sets the session cookie.
 */
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const trimmedName = String(name).trim();
    if (!NAME_RE.test(trimmedName)) {
      return res.status(400).json({ error: "Name must be 1-80 characters and contain only letters." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (!EMAIL_RE.test(normalizedEmail)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    const pwd = String(password);
    if (pwd.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }
    if (pwd.length > 128) {
      return res.status(400).json({ error: "Password must be 128 characters or fewer." });
    }
    if (!/[a-zA-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
      return res.status(400).json({ error: "Password must contain at least one letter and one number." });
    }

    const existing = await Student.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(pwd, 10);
    const student = await Student.create({
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
    });

    const token = signToken(student._id, student.role);
    setSessionCookie(res, token, req);
    res.status(201).json({ student: student.toJSON() });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Verifies the email/password against the stored bcrypt hash. Uses a generic
 * "Invalid email or password" message for both unknown email and wrong password
 * to prevent user enumeration. Sets the session cookie on success.
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (!EMAIL_RE.test(normalizedEmail)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    const student = await Student.findOne({ email: normalizedEmail }).select("+passwordHash");
    if (!student) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const ok = await bcrypt.compare(String(password), student.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(student._id, student.role);
    setSessionCookie(res, token, req);
    res.json({ student: student.toJSON() });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Clears the HTTP-only session cookie. The client cannot forge this cookie
 * or read its contents; clearing it server-side is the authoritative logout.
 */
router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ message: "Logged out." });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated student's public profile.
 * Uses the cookie-based session (no token in the Authorization header).
 */
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const student = await Student.findById(req.studentId, { passwordHash: 0 }).lean();
    if (!student) return res.status(404).json({ error: "Student not found." });
    res.json({ student });
  } catch (err) {
    next(err);
  }
});

// Demonstrate role enforcement: only an admin can access this route.
router.get("/admin", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ message: "Admin area", role: req.studentRole });
});

export default router;
