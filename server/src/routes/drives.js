import { Router } from "express";
import PlacementDrive from "../models/PlacementDrive.js";
import Company from "../models/Company.js";
import { requireDb } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { logAction } from "../services/auditLogger.js";
import Student from "../models/Student.js";
import { checkDriveEligibility } from "../services/driveEligibility.js";

const router = Router();

router.use(requireDb);

// ── Public/student routes ──────────────────────────────────────────

// GET /api/drives — students see published drives; admins see all
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const filter = {};
    const isAdmin = req.studentRole === "admin" || req.studentRole === "super_admin";

    if (!isAdmin) {
      filter.status = "published";
    } else if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.companyId) filter.company = req.query.companyId;
    if (req.query.jobType) filter.jobType = req.query.jobType;
    if (req.query.workMode) filter.workMode = req.query.workMode;

    if (req.query.q) {
      const q = String(req.query.q).trim();
      if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ jobTitle: rx }];
      }
    }

    let sort = { createdAt: -1 };
    if (req.query.sort === "deadline") sort = { applicationDeadline: 1 };
    if (req.query.sort === "recent") sort = { createdAt: -1 };

    const drives = await PlacementDrive.find(filter)
      .populate("company", "name industry logoUrl headquarters")
      .sort(sort)
      .lean();

    res.json({ count: drives.length, drives });
  } catch (err) {
    next(err);
  }
});

// GET /api/drives/:id — single drive with eligibility for the student
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id)
      .populate("company", "name industry logoUrl headquarters website description recruiterContact")
      .lean();
    if (!drive) return res.status(404).json({ error: "Drive not found." });

    const isAdmin = req.studentRole === "admin" || req.studentRole === "super_admin";
    if (!isAdmin && drive.status !== "published") {
      return res.status(404).json({ error: "Drive not found." });
    }

    // Compute eligibility for students
    let eligibility = null;
    if (req.studentRole === "student") {
      const student = await Student.findById(req.studentId).lean();
      if (student) {
        eligibility = checkDriveEligibility(student, drive);
      }
    }

    res.json({ drive, eligibility });
  } catch (err) {
    next(err);
  }
});

// ── Admin routes ───────────────────────────────────────────────────

// POST /api/drives — create a drive (admin/super_admin)
router.post("/", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const data = req.body || {};
    if (!data.companyId) return res.status(400).json({ error: "companyId is required." });
    if (!data.jobTitle) return res.status(400).json({ error: "jobTitle is required." });
    if (!data.applicationDeadline) return res.status(400).json({ error: "applicationDeadline is required." });

    const company = await Company.findById(data.companyId).lean();
    if (!company) return res.status(400).json({ error: "Company not found." });

    if (data.applicationOpenDate && data.applicationDeadline) {
      if (new Date(data.applicationOpenDate) > new Date(data.applicationDeadline)) {
        return res.status(400).json({ error: "Application open date cannot be after the deadline." });
      }
    }

    const drive = await PlacementDrive.create({
      company: data.companyId,
      jobTitle: data.jobTitle,
      jobDescription: data.jobDescription || "",
      jobType: data.jobType || "full-time",
      eligibility: data.eligibility || {},
      package: data.package || {},
      jobLocation: data.jobLocation || "",
      workMode: data.workMode || "onsite",
      applicationOpenDate: data.applicationOpenDate,
      applicationDeadline: data.applicationDeadline,
      driveDate: data.driveDate,
      selectionRounds: data.selectionRounds || [],
      requiredSkills: data.requiredSkills || [],
      applicationInstructions: data.applicationInstructions || "",
      externalApplicationUrl: data.externalApplicationUrl || "",
      status: data.status || "draft",
      resources: data.resources || [],
      createdBy: req.studentId,
    });

    await logAction({
      actor: req.studentId,
      actorName: req.studentName || "",
      actorRole: req.studentRole,
      action: "create_drive",
      resource: "PlacementDrive",
      resourceId: drive._id,
      details: `Created drive "${drive.jobTitle}" for company ${company.name}`,
    });

    res.status(201).json({ drive });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    next(err);
  }
});

// PUT /api/drives/:id — update a drive (admin/super_admin)
router.put("/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const data = req.body || {};
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) return res.status(404).json({ error: "Drive not found." });

    const updateFields = [
      "jobTitle", "jobDescription", "jobType", "eligibility", "package",
      "jobLocation", "workMode", "applicationOpenDate", "applicationDeadline",
      "driveDate", "selectionRounds", "requiredSkills", "applicationInstructions",
      "externalApplicationUrl", "resources",
    ];

    const update = {};
    for (const f of updateFields) {
      if (data[f] !== undefined) update[f] = data[f];
    }
    if (data.companyId) update.company = data.companyId;

    if (update.applicationOpenDate && (update.applicationDeadline || drive.applicationDeadline)) {
      const deadline = update.applicationDeadline || drive.applicationDeadline;
      if (new Date(update.applicationOpenDate) > new Date(deadline)) {
        return res.status(400).json({ error: "Application open date cannot be after the deadline." });
      }
    }

    const updated = await PlacementDrive.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).populate("company", "name industry logoUrl");

    await logAction({
      actor: req.studentId,
      actorName: req.studentName || "",
      actorRole: req.studentRole,
      action: "update_drive",
      resource: "PlacementDrive",
      resourceId: updated._id,
      details: `Updated drive "${updated.jobTitle}"`,
    });

    res.json({ drive: updated });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    next(err);
  }
});

// PUT /api/drives/:id/status — change drive status (admin/super_admin)
router.put("/:id/status", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const validStatuses = ["draft", "published", "closed", "archived"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) return res.status(404).json({ error: "Drive not found." });

    const oldStatus = drive.status;
    drive.status = status;
    if (status === "published" && !drive.publishedAt) {
      // Track publish date via the status change in audit log
    }
    await drive.save();

    await logAction({
      actor: req.studentId,
      actorName: req.studentName || "",
      actorRole: req.studentRole,
      action: "change_drive_status",
      resource: "PlacementDrive",
      resourceId: drive._id,
      details: `Changed drive "${drive.jobTitle}" status from ${oldStatus} to ${status}`,
    });

    res.json({ drive });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/drives/:id — soft delete by archiving (admin/super_admin)
router.delete("/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) return res.status(404).json({ error: "Drive not found." });

    drive.status = "archived";
    await drive.save();

    await logAction({
      actor: req.studentId,
      actorName: req.studentName || "",
      actorRole: req.studentRole,
      action: "archive_drive",
      resource: "PlacementDrive",
      resourceId: drive._id,
      details: `Archived drive "${drive.jobTitle}"`,
    });

    res.json({ message: "Drive archived.", drive });
  } catch (err) {
    next(err);
  }
});

export default router;
