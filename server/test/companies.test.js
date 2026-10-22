import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { setupTestDb, teardownTestDb, clearDb, createTestStudent } from "./testDb.js";
import Company from "../src/models/Company.js";

async function createCompany(data) {
  return Company.create(data);
}

async function loginUser(email, password) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.headers["set-cookie"][0].split(";")[0];
}

describe("Companies API", () => {
  let cookie;

  beforeAll(async () => {
    await setupTestDb();
    await createTestStudent({ email: "companyuser@college.edu", password: "Password1" });
    cookie = await loginUser("companyuser@college.edu", "Password1");
  });

  afterAll(async () => { await teardownTestDb(); });

  beforeEach(async () => {
    await clearDb();
    await createCompany({
      name: "NovaTech Solutions",
      industry: "IT Services",
      headquarters: "Bengaluru, India",
      description: "Cloud and data platforms for fintech clients.",
      requiredSkills: ["Node.js", "React", "SQL"],
      active: true,
    });
    await createCompany({
      name: "CloudPeak Systems",
      industry: "Cloud Infrastructure",
      headquarters: "Hyderabad, India",
      description: "DevOps tooling for enterprises.",
      requiredSkills: ["Docker", "Kubernetes", "AWS"],
      active: true,
    });
    await createCompany({
      name: "GreenEnergy Robotics",
      industry: "Robotics / Hardware",
      headquarters: "Chennai, India",
      description: "Autonomous solar farm robots.",
      requiredSkills: ["C++", "Embedded Systems"],
      active: false,
    });
  });

  describe("GET /api/companies", () => {
    it("returns all companies", async () => {
      const res = await request(app).get("/api/companies").expect(200);
      expect(res.body.count).toBe(3);
      expect(res.body.companies).toHaveLength(3);
    });

    it("filters by active=true", async () => {
      const res = await request(app).get("/api/companies?active=true").expect(200);
      expect(res.body.count).toBe(2);
      expect(res.body.companies.every((c) => c.active)).toBe(true);
    });

    it("filters by active=false", async () => {
      const res = await request(app).get("/api/companies?active=false").expect(200);
      expect(res.body.count).toBe(1);
      expect(res.body.companies[0].name).toBe("GreenEnergy Robotics");
    });

    it("filters by industry", async () => {
      const res = await request(app).get("/api/companies?industry=IT%20Services").expect(200);
      expect(res.body.count).toBe(1);
      expect(res.body.companies[0].name).toBe("NovaTech Solutions");
    });

    it("searches by name", async () => {
      const res = await request(app).get("/api/companies?q=cloudpeak").expect(200);
      expect(res.body.count).toBe(1);
      expect(res.body.companies[0].name).toBe("CloudPeak Systems");
    });

    it("searches by required skills", async () => {
      const res = await request(app).get("/api/companies?q=docker").expect(200);
      expect(res.body.count).toBe(1);
      expect(res.body.companies[0].name).toBe("CloudPeak Systems");
    });

    it("searches by description", async () => {
      const res = await request(app).get("/api/companies?q=solar").expect(200);
      expect(res.body.count).toBe(1);
      expect(res.body.companies[0].name).toBe("GreenEnergy Robotics");
    });

    it("returns empty results for unmatched query", async () => {
      const res = await request(app).get("/api/companies?q=nonexistent").expect(200);
      expect(res.body.count).toBe(0);
    });

    it("sorts by name descending", async () => {
      const res = await request(app).get("/api/companies?sort=-name").expect(200);
      expect(res.body.companies[0].name).toBe("NovaTech Solutions");
    });

    it("combines search + active filter", async () => {
      const res = await request(app).get("/api/companies?q=cloudpeak&active=true").expect(200);
      expect(res.body.count).toBe(1);
      expect(res.body.companies[0].name).toBe("CloudPeak Systems");
    });
  });

  describe("GET /api/companies/industries", () => {
    it("returns distinct industry values", async () => {
      const res = await request(app).get("/api/companies/industries").expect(200);
      expect(res.body.industries).toHaveLength(3);
      expect(res.body.industries).toContain("IT Services");
      expect(res.body.industries).toContain("Cloud Infrastructure");
      expect(res.body.industries).toContain("Robotics / Hardware");
    });
  });

  describe("GET /api/companies/:id", () => {
    it("returns a company by id with all fields", async () => {
      const created = await createCompany({
        name: "Test Company",
        industry: "Testing",
        headquarters: "Test City",
        description: "A test company.",
        requiredSkills: ["JavaScript"],
        eligibilityCriteria: { minCgpa: 7, allowedBranches: ["CSE"], backlogAllowed: false },
        oaPatterns: [{ round: "Coding Test", type: "coding", difficulty: "medium", duration: "60 min", description: "2 problems", topics: ["Arrays"] }],
        interviewQuestions: [{ question: "What is a closure?", type: "technical", difficulty: "medium", round: "Technical" }],
        preparationResources: [{ title: "JS Guide", type: "article", url: "https://example.com", topic: "JavaScript", description: "Learn JS" }],
        active: true,
      });
      const res = await request(app).get(`/api/companies/${created._id}`).expect(200);
      expect(res.body.company.name).toBe("Test Company");
      expect(res.body.company.requiredSkills).toEqual(["JavaScript"]);
      expect(res.body.company.oaPatterns).toHaveLength(1);
      expect(res.body.company.interviewQuestions).toHaveLength(1);
      expect(res.body.company.preparationResources).toHaveLength(1);
      expect(res.body.company.eligibilityCriteria.minCgpa).toBe(7);
    });

    it("returns 404 for a non-existent company", async () => {
      const res = await request(app).get("/api/companies/507f1f77bcf86cd799439011").expect(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  describe("POST /api/companies", () => {
    it("creates a new company when authenticated", async () => {
      const res = await request(app)
        .post("/api/companies").set("Cookie", cookie)
        .send({
          name: "NewCo AI",
          industry: "AI",
          headquarters: "Delhi, India",
          description: "A new AI startup.",
          requiredSkills: ["Python", "PyTorch"],
          hiringProcess: ["Coding Round", "Interview"],
          active: true,
        })
        .expect(201);
      expect(res.body.company.name).toBe("NewCo AI");
      expect(res.body.company.requiredSkills).toEqual(["Python", "PyTorch"]);
    });

    it("rejects creation without authentication", async () => {
      const res = await request(app)
        .post("/api/companies").send({ name: "Unauthorized Co" })
        .expect(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    it("rejects creation with a missing name", async () => {
      const res = await request(app)
        .post("/api/companies").set("Cookie", cookie)
        .send({ industry: "Tech" })
        .expect(400);
      expect(res.body.error).toMatch(/name is required/i);
    });

    it("rejects creation of a duplicate company name", async () => {
      const res = await request(app)
        .post("/api/companies").set("Cookie", cookie)
        .send({ name: "NovaTech Solutions", industry: "IT" })
        .expect(409);
      expect(res.body.error).toMatch(/already exists/i);
    });
  });

  describe("POST /api/companies/enrich", () => {
    it("rejects enrichment without authentication", async () => {
      const res = await request(app)
        .post("/api/companies/enrich").send({ companyName: "Tesla" })
        .expect(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    it("rejects enrichment without a company name", async () => {
      const res = await request(app)
        .post("/api/companies/enrich").set("Cookie", cookie)
        .send({ companyName: "" })
        .expect(400);
      expect(res.body.error).toMatch(/companyName is required/i);
    });

    it("returns 409 if the company name already exists in DB", async () => {
      const res = await request(app)
        .post("/api/companies/enrich").set("Cookie", cookie)
        .send({ companyName: "NovaTech Solutions" })
        .expect(409);
      expect(res.body.error).toMatch(/already exists/i);
      expect(res.body.company).toBeDefined();
      expect(res.body.company.name).toBe("NovaTech Solutions");
    });
  });
});
