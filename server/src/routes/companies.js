import { Router } from "express";
import Company from "../models/Company.js";
import { requireDb } from "../config/db.js";

const router = Router();

router.use(requireDb);

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.active === "true") filter.active = true;
    if (req.query.active === "false") filter.active = false;
    if (req.query.industry) filter.industry = req.query.industry;

    const companies = await Company.find(filter).sort({ name: 1 }).lean();
    res.json({ count: companies.length, companies });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).lean();
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json({ company });
  } catch (err) {
    next(err);
  }
});

export default router;
