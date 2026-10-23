import { Router } from "express";
import PlacementDrive from "../models/PlacementDrive.js";
import PlacementApplication from "../models/PlacementApplication.js";
import Company from "../models/Company.js";
import Announcement from "../models/Announcement.js";
import Notification from "../models/Notification.js";
import Student from "../models/Student.js";
import PlacementExperience from "../models/PlacementExperience.js";
import PrepProgress from "../models/PrepProgress.js";
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
      totalExperiences,
      pendingExperiences,
      approvedExperiences,
      totalStudentsAgg,
      prepPlansAgg,
      recentDrives,
      recentAnnouncements,
      recentStudents,
      recentExperiences,
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
      PlacementExperience.countDocuments({}),
      PlacementExperience.countDocuments({ moderationStatus: "pending" }),
      PlacementExperience.countDocuments({ moderationStatus: "approved" }),
      Student.aggregate([
        { $match: { archived: { $ne: true } } },
        { $count: "total" },
      ]),
      PrepProgress.aggregate([
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
      Student.find({ archived: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select({ passwordHash: 0 })
        .lean(),
      PlacementExperience.find({})
        .populate("company", "name industry")
        .sort({ postedAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const statusBreakdown = await PlacementDrive.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const appStatusBreakdown = await PlacementApplication.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

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
        totalExperiences,
        pendingExperiences,
        approvedExperiences,
        totalAllUsers: totalStudentsAgg[0]?.total || 0,
        totalPrepPlans: prepPlansAgg[0]?.total || 0,
      },
      charts: {
        driveStatus: statusBreakdown.map((s) => ({ status: s._id, count: s.count })),
        applicationStatus: appStatusBreakdown.map((s) => ({ status: s._id, count: s.count })),
        industryBreakdown: industryBreakdown.map((s) => ({ industry: s._id || "Unknown", count: s.count })),
      },
      recentDrives,
      recentAnnouncements,
      recentStudents: recentStudents.map((s) => ({
        _id: s._id,
        name: s.name,
        email: s.email,
        role: s.role,
        createdAt: s.createdAt,
      })),
      recentExperiences: recentExperiences.map((e) => ({
        _id: e._id,
        studentName: e.studentName,
        role: e.role,
        company: e.company,
        outcome: e.outcome,
        moderationStatus: e.moderationStatus,
        postedAt: e.postedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/students — list all students with search, filter, pagination
//   ?q=<text>        search name or email
//   ?graduationYear=<n>
//   ?branch=<text>
//   ?page=<n>        default 1
//   ?limit=<n>       default 20, max 100
router.get("/students", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const filter = { archived: { $ne: true } };

    if (req.query.q) {
      const q = String(req.query.q).trim();
      if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ name: rx }, { email: rx }];
      }
    }
    if (req.query.graduationYear) {
      const y = parseInt(req.query.graduationYear);
      if (Number.isFinite(y)) filter.graduationYear = y;
    }
    if (req.query.branch) {
      filter.branch = String(req.query.branch).trim();
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(filter, { passwordHash: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter),
    ]);

    res.json({ count: students.length, total, page, pages: Math.ceil(total / limit), students });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/students/:id — student detail (admin)
router.get("/students/:id", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const s = await Student.findById(req.params.id, { passwordHash: 0 }).lean();
    if (!s) return res.status(404).json({ error: "Student not found." });
    res.json({ student: s });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/students/:id/suspend — archive (suspend) a student (admin)
router.put("/students/:id/suspend", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const s = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: { archived: true } },
      { new: true }
    ).select({ passwordHash: 0 });
    if (!s) return res.status(404).json({ error: "Student not found." });

    await logAction({
      actor: req.studentId,
      actorName: req.studentName || "",
      actorRole: req.studentRole,
      action: "suspend_student",
      resource: "Student",
      resourceId: s._id,
      details: `Suspended ${s.email}`,
    });

    res.json({ student: s });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/students/:id/reactivate — unarchive (reactivate) a student (admin)
router.put("/students/:id/reactivate", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const s = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: { archived: false } },
      { new: true }
    ).select({ passwordHash: 0 });
    if (!s) return res.status(404).json({ error: "Student not found." });

    await logAction({
      actor: req.studentId,
      actorName: req.studentName || "",
      actorRole: req.studentRole,
      action: "reactivate_student",
      resource: "Student",
      resourceId: s._id,
      details: `Reactivated ${s.email}`,
    });

    res.json({ student: s });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/analytics — AI & career intelligence overview
router.get("/analytics", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const [
      totalPrepPlans,
      prepPlansAgg,
      popularCompanies,
      topMissingSkills,
      topMatchedSkills,
      avgReadiness,
      eligibilityStats,
    ] = await Promise.all([
      PrepProgress.countDocuments({}),
      PrepProgress.aggregate([
        { $group: { _id: null, total: { $sum: 1 } } },
      ]),
      PrepProgress.aggregate([
        { $group: { _id: "$companyId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "companies",
            localField: "_id",
            foreignField: "_id",
            as: "company",
            pipeline: [{ $project: { name: 1, industry: 1 } }],
          },
        },
        { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, count: 1, name: "$company.name", industry: "$company.industry" } },
      ]),
      PrepProgress.aggregate([
        { $unwind: "$missing" },
        { $group: { _id: "$missing", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
        { $project: { _id: 0, skill: "$_id", count: 1 } },
      ]),
      PrepProgress.aggregate([
        { $unwind: "$matched" },
        { $group: { _id: "$matched", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
        { $project: { _id: 0, skill: "$_id", count: 1 } },
      ]),
      PrepProgress.aggregate([
        { $match: { readiness: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: "$readiness" }, min: { $min: "$readiness" }, max: { $max: "$readiness" } } },
      ]),
      PrepProgress.aggregate([
        { $group: { _id: null, passed: { $sum: { $cond: ["$eligibilityPassed", 1, 0] } }, total: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      stats: {
        totalPrepPlans,
        avgReadiness: avgReadiness[0] ? Math.round(avgReadiness[0].avg) : null,
        minReadiness: avgReadiness[0]?.min ?? null,
        maxReadiness: avgReadiness[0]?.max ?? null,
        eligibilityPassed: eligibilityStats[0]?.passed || 0,
        eligibilityTotal: eligibilityStats[0]?.total || 0,
      },
      popularCompanies: popularCompanies.map((p) => ({
        companyId: p._id,
        name: p.name || "Unknown",
        industry: p.industry || "",
        count: p.count,
      })),
      topMissingSkills,
      topMatchedSkills,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/experiences — list experiences for moderation with filters + pagination
//   ?status=pending|approved|rejected
//   ?companyId=<id>
//   ?outcome=<value>
//   ?q=<text>       search studentName or role
//   ?page=<n>       default 1
//   ?limit=<n>      default 20, max 100
router.get("/experiences", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.moderationStatus = req.query.status;
    if (req.query.companyId) filter.company = req.query.companyId;
    if (req.query.outcome) filter.outcome = req.query.outcome;

    if (req.query.q) {
      const q = String(req.query.q).trim();
      if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ studentName: rx }, { role: rx }];
      }
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [experiences, total] = await Promise.all([
      PlacementExperience.find(filter)
        .populate("company", "name industry")
        .sort({ postedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PlacementExperience.countDocuments(filter),
    ]);

    res.json({ count: experiences.length, total, page, pages: Math.ceil(total / limit), experiences });
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
