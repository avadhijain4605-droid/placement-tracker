import { Router } from "express";
import Company from "../models/Company.js";
import { requireDb } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { generateCompanyIntelligence } from "../services/gemini.js";

const router = Router();

router.use(requireDb);

// GET /api/companies — list with optional search, filters, and sorting.
//   ?q=<text>       search across name, description, requiredSkills
//   ?active=true|false
//   ?industry=<string>
//   ?sort=name | -name | recent | industry  (default: name asc)
router.get("/", async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.active === "true") filter.active = true;
    if (req.query.active === "false") filter.active = false;
    if (req.query.industry) filter.industry = req.query.industry;

    if (req.query.q) {
      const q = String(req.query.q).trim();
      if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [
          { name: rx },
          { description: rx },
          { requiredSkills: rx },
        ];
      }
    }

    let sort = { name: 1 };
    switch (req.query.sort) {
      case "-name":
        sort = { name: -1 };
        break;
      case "recent":
        sort = { createdAt: -1 };
        break;
      case "industry":
        sort = { industry: 1, name: 1 };
        break;
      default:
        sort = { name: 1 };
    }

    const companies = await Company.find(filter).sort(sort).lean();
    res.json({ count: companies.length, companies });
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/industries — distinct industry values for filter dropdown.
// MUST be declared before /:id to avoid capturing "industries" as an id.
router.get("/industries", async (req, res, next) => {
  try {
    const industries = await Company.distinct("industry");
    res.json({ industries });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/enrich — AI-generate a company intelligence profile (auth required).
// Does NOT save to DB — returns the generated profile for user preview.
router.post("/enrich", requireAuth, async (req, res, next) => {
  try {
    const { companyName } = req.body || {};
    if (!companyName || typeof companyName !== "string" || !companyName.trim()) {
      return res.status(400).json({ error: "companyName is required." });
    }

    // Check if a company with this name already exists.
    const existing = await Company.findOne({
      name: { $regex: `^${companyName.trim()}$`, $options: "i" },
    }).lean();
    if (existing) {
      return res.status(409).json({ error: "A company with this name already exists.", company: existing });
    }

    let profile;
    try {
      profile = await generateCompanyIntelligence(companyName.trim());
    } catch (err) {
      if (err.code === "GEMINI_NOT_CONFIGURED") return res.status(503).json({ error: err.message });
      if (err.code === "GEMINI_RATE_LIMIT") return res.status(429).json({ error: err.message });
      if (err.code === "GEMINI_BAD_INPUT") return res.status(502).json({ error: err.message });
      if (err.code === "GEMINI_INVALID_OUTPUT") {
        return res.status(502).json({ error: "The AI returned an invalid profile. Please try again." });
      }
      throw err;
    }

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies — save a new company to the database (auth required).
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const data = req.body || {};
    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      return res.status(400).json({ error: "Company name is required." });
    }

    const existing = await Company.findOne({
      name: { $regex: `^${data.name.trim()}$`, $options: "i" },
    }).lean();
    if (existing) {
      return res.status(409).json({ error: "A company with this name already exists." });
    }

    const created = await Company.create(data);
    res.status(201).json({ company: created.toObject() });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// GET /api/companies/:id — single company with all intelligence fields.
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
