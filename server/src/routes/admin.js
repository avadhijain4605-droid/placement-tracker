import { Router } from "express";
import PlacementDrive from "../models/PlacementDrive.js";
import PlacementApplication from "../models/PlacementApplication.js";
import Company from "../models/Company.js";
import Announcement from "../models/Announcement.js";
import Notification from "../models/Notification.js";
import Student from "../models/Student.js";
import { requireDb } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import AuditLog from "../models/AuditLog.js";
import { logAction } from "../services/auditLogger.js";

const router = Router();

router.use(requireDb, requireAuth);

// GET /api/admin/dashboard — placement cell dashboard statistics
router.get("/dashboard", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const [
      totalCompanies,
      activeDrives,
      upcomingDeadlines,
      totalEligibleAgg,
      applicationsAgg,
      selectedAgg,
      recentDrives,
      recentAnnouncements,
    ] = await Promise.all([
      Company.countDocuments({ archived: { $ne: true } }),
      PlacementDrive.countDocuments({ status: "published" }),
      PlacementDrive.countDocuments({
        status: "published",
        applicationDeadline: { $gte: new Date() },
      }),
      Student.aggregate([
        { $match: { role: "student", archived: { $ne: true } } },
        { $count: "total" },
      ]),
      PlacementApplication.aggregate([
        { $group: { _id: null, total: { $sum: 1 } } },
      ]),
      PlacementApplication.aggregate([
        { $match: { status: "selected" } },
        { $group: { _id: null, total: { $sum: 1 } } },
      ]),
      PlacementDrive.find({})
        .populate("company", "name industry logoUrl")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Announcement.find({ published: true })
        .sort({ publishedAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Drive status breakdown for chart
    const statusBreakdown = await PlacementDrive.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Application status breakdown for chart
    const appStatusBreakdown = await PlacementApplication.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Companies per industry for chart
    const industryBreakdown = await Company.aggregate([
      { $match: { archived: { $ne: true } } },
      { $group: { _id: "$industry", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    res.json({
      stats: {
        totalCompanies,
        activeDrives,
        upcomingDeadlines,
        totalStudents: totalEligibleAgg[0]?.total || 0,
        totalApplications: applicationsAgg[0]?.total || 0,
        totalSelected: selectedAgg[0]?.total || 0,
      },
      charts: {
        driveStatus: statusBreakdown.map((s) => ({ status: s._id, count: s.count })),
        applicationStatus: appStatusBreakdown.map((s) => ({ status: s._id, count: s.count })),
        industryBreakdown: industryBreakdown.map((s) => ({ industry: s._id || "Unknown", count: s.count })),
      },
      recentDrives,
      recentAnnouncements,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users — list all users (super_admin only)
router.get("/users", requireRole("super_admin"), async (req, res, next) => {
  try {
    const users = await Student.find({}, { passwordHash: 0 })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ count: users.length, users });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/role — change a user's role (super_admin only)
router.put("/users/:id/role", requireRole("super_admin"), async (req, res, next) => {
  try {
    const { role } = req.body || {};
    const validRoles = ["student", "admin", "super_admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be one of: student, admin, super_admin." });
    }
    if (String(req.params.id) === String(req.studentId) && role !== "super_admin") {
      return res.status(400).json({ error: "You cannot demote yourself." });
    }

    const user = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    ).select({ passwordHash: 0 });

    if (!user) return res.status(404).json({ error: "User not found." });

    await logAction({
      actor: req.studentId,
      actorName: req.studentName || "",
      actorRole: req.studentRole,
      action: "change_role",
      resource: "Student",
      resourceId: user._id,
      details: `Changed ${user.email} role to ${role}`,
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/archive — archive/unarchive a user (super_admin only)
router.put("/users/:id/archive", requireRole("super_admin"), async (req, res, next) => {
  try {
    const user = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: { archived: true } },
      { new: true }
    ).select({ passwordHash: 0 });
    if (!user) return res.status(404).json({ error: "User not found." });

    await logAction({
      actor: req.studentId,
      actorName: req.studentName || "",
      actorRole: req.studentRole,
      action: "archive_user",
      resource: "Student",
      resourceId: user._id,
      details: `Archived ${user.email}`,
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/audit — audit logs (super_admin only)
router.get("/audit", requireRole("super_admin"), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.resource) filter.resource = req.query.resource;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ count: logs.length, total, page, pages: Math.ceil(total / limit), logs });
  } catch (err) {
    next(err);
  }
});

export default router;
