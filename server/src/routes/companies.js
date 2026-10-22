import { Router } from "express";
import Company from "../models/Company.js";
import { requireDb } from "../config/db.js";

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
