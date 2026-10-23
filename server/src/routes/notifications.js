import { Router } from "express";
import Notification from "../models/Notification.js";
import { requireDb } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireDb, requireAuth);

// GET /api/notifications — list current user's notifications
router.get("/", async (req, res, next) => {
  try {
    const notifications = await Notification.find({ student: req.studentId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ count: notifications.length, unreadCount, notifications });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read — mark as read
router.put("/:id/read", async (req, res, next) => {
  try {
    const notif = await Notification.findOne({
      _id: req.params.id,
      student: req.studentId,
    });
    if (!notif) return res.status(404).json({ error: "Notification not found." });
    notif.read = true;
    await notif.save();
    res.json({ notification: notif });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/read-all — mark all as read
router.put("/read-all", async (req, res, next) => {
  try {
    await Notification.updateMany(
      { student: req.studentId, read: false },
      { $set: { read: true } }
    );
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    next(err);
  }
});

export default router;
