import { Router } from "express";
import PlacementExperience from "../models/PlacementExperience.js";
import { requireDb } from "../config/db.js";

const router = Router();

router.use(requireDb);

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.companyId) filter.company = req.query.companyId;
    if (req.query.outcome) filter.outcome = req.query.outcome;

    const experiences = await PlacementExperience.find(filter)
      .populate("company", "name industry headquarters")
      .sort({ postedAt: -1 })
      .lean();
    res.json({ count: experiences.length, experiences });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const exp = await PlacementExperience.findById(req.params.id)
      .populate("company", "name industry headquarters")
      .lean();
    if (!exp) return res.status(404).json({ error: "Experience not found" });
    res.json({ experience: exp });
  } catch (err) {
    next(err);
  }
});

export default router;
