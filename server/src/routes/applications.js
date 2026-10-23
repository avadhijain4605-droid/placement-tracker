import { Router } from "express";
import PlacementApplication from "../models/PlacementApplication.js";
import PlacementDrive from "../models/PlacementDrive.js";
import Notification from "../models/Notification.js";
import { requireDb } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { logAction } from "../services/auditLogger.js";

const router = Router();

router.use(requireDb, requireAuth);

// GET /api/applications — admin: all applications with filters; student: own applications
router.get("/", async (req, res, next) => {
  try {
    const isAdmin = req.studentRole === "admin" || req.studentRole === "super_admin";
    const filter = {};

    if (!isAdmin) {
      filter.student = req.studentId;
    }

    if (req.query.driveId) filter.drive = req.query.driveId;
    if (req.query.companyId) filter.company = req.query.companyId;
    if (req.query.status) filter.status = req.query.status;

    let query = PlacementApplication.find(filter)
      .populate("drive", "jobTitle jobType package jobLocation workMode")
      .populate("company", "name industry logoUrl");

    if (!isAdmin) {
      query = query.populate("student", "name email branch cgpa graduationYear");
    } else {
      query = query.populate("student", "name email branch cgpa graduationYear college");
    }

    const applications = await query.sort({ createdAt: -1 }).lean();
    res.json({ count: applications.length, applications });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id — student sees only their own; admin sees any
router.get("/:id", async (req, res, next) => {
  try {
    const isAdmin = req.studentRole === "admin" || req.studentRole === "super_admin";
    const app = await PlacementApplication.findById(req.params.id)
      .populate("drive", "jobTitle jobType package jobLocation workMode applicationDeadline")
      .populate("company", "name industry logoUrl")
      .populate("student", "name email branch cgpa graduationYear college")
      .lean();

    if (!app) return res.status(404).json({ error: "Application not found." });
    if (!isAdmin && String(app.student._id) !== String(req.studentId)) {
      return res.status(403).json({ error: "You can only view your own applications." });
    }

    res.json({ application: app });
  } catch (err) {
    next(err);
  }
});

// POST /api/applications — student applies to a drive
router.post("/", async (req, res, next) => {
  try {
    const { driveId, coverNote } = req.body || {};
    if (!driveId) return res.status(400).json({ error: "driveId is required." });

    const drive = await PlacementDrive.findById(driveId).lean();
    if (!drive) return res.status(404).json({ error: "Drive not found." });
    if (drive.status !== "published") {
      return res.status(400).json({ error: "This drive is not currently accepting applications." });
    }

    // Check deadline
    if (new Date(drive.applicationDeadline) < new Date()) {
      return res.status(400).json({ error: "The application deadline has passed." });
    }

    // Check for duplicate
    const existing = await PlacementApplication.findOne({
      student: req.studentId,
      drive: driveId,
    });
    if (existing) {
      return res.status(409).json({ error: "You have already applied to this drive." });
    }

    const app = await PlacementApplication.create({
      student: req.studentId,
      drive: driveId,
      company: drive.company,
      status: "applied",
      statusHistory: [{ status: "applied", changedBy: req.studentId, note: "Application submitted" }],
      coverNote: coverNote || "",
    });

    res.status(201).json({ application: app });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "You have already applied to this drive." });
    }
    next(err);
  }
});

// PUT /api/applications/:id/status — admin updates application status
router.put("/:id/status", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { status, note } = req.body || {};
    const validStatuses = ["applied", "shortlisted", "assessment", "interview", "selected", "rejected", "withdrawn"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const app = await PlacementApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found." });

    const oldStatus = app.status;
    app.status = status;
    app.statusHistory.push({
      status,
      changedBy: req.studentId,
      note: note || "",
      changedAt: new Date(),
    });
    await app.save();

    // Notify the student
    await Notification.create({
      student: app.student,
      title: `Application status updated: ${status}`,
      message: `Your application status has been updated from "${oldStatus}" to "${status}".${note ? " Note: " + note : ""}`,
      link: "/applications",
    });

    await logAction({
      actor: req.studentId,
      actorName: req.studentName || "",
      actorRole: req.studentRole,
      action: "update_application_status",
      resource: "PlacementApplication",
      resourceId: app._id,
      details: `Changed application status from ${oldStatus} to ${status}`,
    });

    res.json({ application: app });
  } catch (err) {
    next(err);
  }
});

// PUT /api/applications/:id/withdraw — student withdraws their own application
router.put("/:id/withdraw", async (req, res, next) => {
  try {
    const app = await PlacementApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found." });
    if (String(app.student) !== String(req.studentId)) {
      return res.status(403).json({ error: "You can only withdraw your own applications." });
    }

    app.status = "withdrawn";
    app.statusHistory.push({
      status: "withdrawn",
      changedBy: req.studentId,
      note: "Withdrawn by student",
      changedAt: new Date(),
    });
    await app.save();

    res.json({ application: app });
  } catch (err) {
    next(err);
  }
});

export default router;
