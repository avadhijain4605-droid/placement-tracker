import { Router } from "express";
import Announcement from "../models/Announcement.js";
import { requireDb } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { logAction } from "../services/auditLogger.js";

const router = Router();

router.use(requireDb);

// ── Student routes ─────────────────────────────────────────────────

// GET /api/announcements — students see published, non-expired announcements
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const isAdmin = req.studentRole === "admin" || req.studentRole === "super_admin";
    const filter = {};

    if (!isAdmin) {
      filter.published = true;
      // Exclude expired announcements (expiresAt in the past)
      filter.$or = [
        { expiresAt: null },
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ];
    }

    if (req.query.category) filter.category = req.query.category;

    const announcements = await Announcement.find(filter)
      .populate("drive", "jobTitle")
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    res.json({ count: announcements.length, announcements });
  } catch (err) {
    next(err);
  }
});

// GET /api/announcements/:id — single announcement
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const ann = await Announcement.findById(req.params.id).populate("drive", "jobTitle").lean();
    if (!ann) return res.status(404).json({ error: "Announcement not found." });

    const isAdmin = req.studentRole === "admin" || req.studentRole === "super_admin";
    if (!isAdmin && !ann.published) {
      return res.status(404).json({ error: "Announcement not found." });
    }

    // Students cannot view expired announcements
    if (!isAdmin && ann.expiresAt && new Date(ann.expiresAt) < new Date()) {
      return res.status(404).json({ error: "Announcement not found." });
    }

    res.json({ announcement: ann });
  } catch (err) {
    next(err);
  }
});

// ── Admin routes ───────────────────────────────────────────────────

// POST /api/announcements — create announcement (admin/super_admin)
router.post("/", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { title, content, category, driveId, published, expiresAt } = req.body || {};
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required." });
    }

    const ann = await Announcement.create({
      title,
      content,
      category: category || "general",
      drive: driveId || null,
      published: published || false,
      publishedAt: published ? new Date() : null,
      expiresAt: expiresAt || null,
      createdBy: req.studentId,
    });

    await logAction({
      actor: req.studentId,
      actorName: req.studentName || "",
      actorRole: req.studentRole,
      action: "create_announcement",
      resource: "Announcement",
      resourceId: ann._id,
      details: `Created announcement "${title}"${published ? " (published)" : " (draft)"}`,
    });

    res.status(201).json({ announcement: ann });
  } catch (err) {
    next(err);
  }
});

// PUT /api/announcements/:id — update announcement (admin/super_admin)
router.put("/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { title, content, category, driveId, published, expiresAt } = req.body || {};
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ error: "Announcement not found." });

    if (title !== undefined) ann.title = title;
    if (content !== undefined) ann.content = content;
    if (category !== undefined) ann.category = category;
    if (driveId !== undefined) ann.drive = driveId || null;
    if (expiresAt !== undefined) ann.expiresAt = expiresAt || null;

    if (published !== undefined) {
      if (published && !ann.published) {
        ann.published = true;
        ann.publishedAt = new Date();
      } else if (!published) {
        ann.published = false;
      }
    }

    await ann.save();

    await logAction({
      actor: req.studentId,
      actorName: req.studentName || "",
      actorRole: req.studentRole,
      action: "update_announcement",
      resource: "Announcement",
      resourceId: ann._id,
      details: `Updated announcement "${ann.title}"`,
    });

    res.json({ announcement: ann });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/announcements/:id — delete announcement (admin/super_admin)
router.delete("/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const ann = await Announcement.findByIdAndDelete(req.params.id);
    if (!ann) return res.status(404).json({ error: "Announcement not found." });

    await logAction({
      actor: req.studentId,
      actorName: req.studentName || "",
      actorRole: req.studentRole,
      action: "delete_announcement",
      resource: "Announcement",
      resourceId: ann._id,
      details: `Deleted announcement "${ann.title}"`,
    });

    res.json({ message: "Announcement deleted." });
  } catch (err) {
    next(err);
  }
});

export default router;
