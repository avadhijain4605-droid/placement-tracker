import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Student from "../models/Student.js";
import { requireDb } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireDb);

// ── Resume upload config ──────────────────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "resumes");

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `resume_${req.studentId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const isPdf = ext === ".pdf" || file.mimetype === "application/pdf";
    if (!isPdf) return cb(new Error("Only PDF files are allowed."));
    cb(null, true);
  },
});

// ── Field allowlist & validators ──────────────────────────────────

const ALLOWED_FIELDS = [
  "phone",
  "college",
  "degree",
  "branch",
  "graduationYear",
  "cgpa",
  "totalActiveBacklogs",
  "backlogHistory",
  "skills",
  "programmingLanguages",
  "frameworks",
  "projects",
  "internships",
  "achievements",
  "certifications",
  "codingProfiles",
  "preferredRoles",
  "preferredLocations",
  "jobType",
  "placementStatus",
  "offers",
];

const URL_RE = /^https?:\/\/[^\s<>"]{1,500}$/i;
const CODING_PLATFORMS = [
  "leetcode", "hackerrank", "codechef", "codeforces",
  "github", "geeksforgeeks", "linkedin", "portfolio", "other",
];

function validateUrl(value) {
  if (!value) return true;
  return URL_RE.test(String(value).trim());
}

function validateStringArray(arr) {
  if (!Array.isArray(arr)) return false;
  return arr.every((s) => typeof s === "string" && s.trim().length <= 200);
}

function validateProjects(arr) {
  if (!Array.isArray(arr)) return false;
  return arr.every((p) =>
    typeof p?.title === "string" && p.title.trim() &&
    (p.githubLink === undefined || validateUrl(p.githubLink)) &&
    (p.demoLink === undefined || validateUrl(p.demoLink))
  );
}

function validateCertifications(arr) {
  if (!Array.isArray(arr)) return false;
  return arr.every((c) =>
    typeof c?.name === "string" && c.name.trim() &&
    (c.credentialUrl === undefined || c.credentialUrl === "" || validateUrl(c.credentialUrl))
  );
}

function validateInternships(arr) {
  if (!Array.isArray(arr)) return false;
  return arr.every((i) =>
    typeof i?.company === "string" && i.company.trim()
  );
}

function validateAchievements(arr) {
  if (!Array.isArray(arr)) return false;
  return arr.every((a) =>
    typeof a?.title === "string" && a.title.trim()
  );
}

function validateCodingProfiles(arr) {
  if (!Array.isArray(arr)) return false;
  return arr.every((c) =>
    CODING_PLATFORMS.includes(c?.platform) &&
    (c.url === undefined || c.url === "" || validateUrl(c.url))
  );
}

function validateOffers(arr) {
  if (!Array.isArray(arr)) return false;
  return arr.every((o) =>
    typeof o?.company === "string" && o.company.trim() &&
    (o.status === undefined || ["accepted", "rejected", "pending"].includes(o.status))
  );
}

// All student routes require authentication.
router.use(requireAuth);

// ── PUT /api/students/me — update profile ─────────────────────────
router.put("/me", async (req, res, next) => {
  try {
    const update = {};
    for (const f of ALLOWED_FIELDS) {
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, f)) {
        update[f] = req.body[f];
      }
    }

    // Numeric validation
    if (update.graduationYear !== undefined && update.graduationYear !== null && update.graduationYear !== "") {
      const y = Number(update.graduationYear);
      if (!Number.isFinite(y) || y < 2000 || y > 2100) {
        return res.status(400).json({ error: "graduationYear must be between 2000 and 2100." });
      }
      update.graduationYear = y;
    } else if (update.graduationYear === "") {
      update.graduationYear = undefined;
    }

    if (update.cgpa !== undefined && update.cgpa !== null && update.cgpa !== "") {
      const c = Number(update.cgpa);
      if (!Number.isFinite(c) || c < 0 || c > 10) {
        return res.status(400).json({ error: "cgpa must be between 0 and 10." });
      }
      update.cgpa = c;
    } else if (update.cgpa === "") {
      update.cgpa = undefined;
    }

    if (update.totalActiveBacklogs !== undefined && update.totalActiveBacklogs !== null) {
      const b = Number(update.totalActiveBacklogs);
      if (!Number.isFinite(b) || b < 0) {
        return res.status(400).json({ error: "totalActiveBacklogs must be 0 or a positive number." });
      }
      update.totalActiveBacklogs = b;
      // Keep legacy `backlogs` field in sync for the eligibility checker.
      update.backlogs = b;
    }

    if (update.backlogHistory !== undefined && update.backlogHistory !== null) {
      const bh = Number(update.backlogHistory);
      if (!Number.isFinite(bh) || bh < 0) {
        return res.status(400).json({ error: "backlogHistory must be 0 or a positive number." });
      }
      update.backlogHistory = bh;
    }

    // Array validation
    if (update.skills !== undefined) {
      if (!validateStringArray(update.skills)) {
        return res.status(400).json({ error: "skills must be an array of strings." });
      }
      update.skills = update.skills.map((s) => String(s).trim()).filter(Boolean);
    }

    if (update.programmingLanguages !== undefined) {
      if (!validateStringArray(update.programmingLanguages)) {
        return res.status(400).json({ error: "programmingLanguages must be an array of strings." });
      }
      update.programmingLanguages = update.programmingLanguages.map((s) => String(s).trim()).filter(Boolean);
    }

    if (update.frameworks !== undefined) {
      if (!validateStringArray(update.frameworks)) {
        return res.status(400).json({ error: "frameworks must be an array of strings." });
      }
      update.frameworks = update.frameworks.map((s) => String(s).trim()).filter(Boolean);
    }

    if (update.preferredRoles !== undefined) {
      if (!validateStringArray(update.preferredRoles)) {
        return res.status(400).json({ error: "preferredRoles must be an array of strings." });
      }
      update.preferredRoles = update.preferredRoles.map((s) => String(s).trim()).filter(Boolean);
    }

    if (update.preferredLocations !== undefined) {
      if (!validateStringArray(update.preferredLocations)) {
        return res.status(400).json({ error: "preferredLocations must be an array of strings." });
      }
      update.preferredLocations = update.preferredLocations.map((s) => String(s).trim()).filter(Boolean);
    }

    // Nested array validation
    if (update.projects !== undefined) {
      if (!validateProjects(update.projects)) {
        return res.status(400).json({ error: "Each project needs a title; GitHub/demo links must be valid URLs." });
      }
    }

    if (update.certifications !== undefined) {
      if (!validateCertifications(update.certifications)) {
        return res.status(400).json({ error: "Each certification needs a name; credential URL must be valid." });
      }
    }

    if (update.internships !== undefined) {
      if (!validateInternships(update.internships)) {
        return res.status(400).json({ error: "Each internship entry needs a company name." });
      }
    }

    if (update.achievements !== undefined) {
      if (!validateAchievements(update.achievements)) {
        return res.status(400).json({ error: "Each achievement needs a title." });
      }
    }

    if (update.codingProfiles !== undefined) {
      if (!validateCodingProfiles(update.codingProfiles)) {
        return res.status(400).json({ error: "Coding profiles must have a valid platform and valid URL." });
      }
    }

    if (update.offers !== undefined) {
      if (!validateOffers(update.offers)) {
        return res.status(400).json({ error: "Each offer needs a company name and valid status." });
      }
    }

    if (update.jobType !== undefined && update.jobType !== "") {
      if (!["full-time", "internship", "both"].includes(update.jobType)) {
        return res.status(400).json({ error: "jobType must be 'full-time', 'internship', or 'both'." });
      }
    }

    if (update.placementStatus !== undefined && update.placementStatus !== "") {
      if (!["not_placed", "placed", "in_process"].includes(update.placementStatus)) {
        return res.status(400).json({ error: "placementStatus must be 'not_placed', 'placed', or 'in_process'." });
      }
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

// ── GET /api/students/me ──────────────────────────────────────────
router.get("/me", async (req, res, next) => {
  try {
    const student = await Student.findById(req.studentId, { passwordHash: 0 }).lean();
    if (!student) return res.status(404).json({ error: "Student not found." });
    res.json({ student });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/students/me/resume — upload PDF resume ──────────────
router.post("/me/resume", upload.single("resume"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a PDF file (max 5 MB)." });
    }

    const student = await Student.findByIdAndUpdate(
      req.studentId,
      {
        $set: {
          resume: {
            filename: req.file.originalname,
            path: req.file.filename,
            uploadedAt: new Date(),
          },
        },
      },
      { new: true }
    ).select({ passwordHash: 0 });

    if (!student) {
      // Clean up orphaned file
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: "Student not found." });
    }

    res.json({
      resume: student.resume,
      student,
    });
  } catch (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Resume must be 5 MB or smaller." });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err.message === "Only PDF files are allowed.") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ── GET /api/students/me/resume — download resume ─────────────────
router.get("/me/resume", async (req, res, next) => {
  try {
    const student = await Student.findById(req.studentId).lean();
    if (!student) return res.status(404).json({ error: "Student not found." });
    if (!student.resume?.path) return res.status(404).json({ error: "No resume uploaded." });

    const filePath = path.join(UPLOAD_DIR, student.resume.path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Resume file not found on disk." });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${student.resume.filename || "resume.pdf"}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/students/me/resume — delete resume ────────────────
router.delete("/me/resume", async (req, res, next) => {
  try {
    const student = await Student.findById(req.studentId);
    if (!student) return res.status(404).json({ error: "Student not found." });
    if (!student.resume?.path) return res.status(404).json({ error: "No resume uploaded." });

    const filePath = path.join(UPLOAD_DIR, student.resume.path);
    fs.unlink(filePath, () => {});

    student.resume = { filename: "", path: "", uploadedAt: null };
    await student.save();

    res.json({ message: "Resume deleted." });
  } catch (err) {
    next(err);
  }
});

// ── Admin / list routes ───────────────────────────────────────────
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
