import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { setupTestDb, teardownTestDb, clearDb, createTestStudent } from "./testDb.js";
import Company from "../src/models/Company.js";
import PlacementExperience from "../src/models/PlacementExperience.js";

async function createCompany(name = "Test Company") {
  return Company.create({ name, industry: "IT Services", headquarters: "Bengaluru, India", active: true });
}

async function loginUser(email, password) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.headers["set-cookie"][0].split(";")[0];
}

describe("Experiences API", () => {
  let company, cookie;

  beforeAll(async () => { await setupTestDb(); });
  afterAll(async () => { await teardownTestDb(); });

  beforeEach(async () => {
    await clearDb();
    company = await createCompany();
    await createTestStudent({ email: "expstudent@college.edu", password: "Password1" });
    cookie = await loginUser("expstudent@college.edu", "Password1");
  });

  describe("GET /api/experiences", () => {
    it("returns an empty list when no experiences exist", async () => {
      const res = await request(app).get("/api/experiences").expect(200);
      expect(res.body.count).toBe(0);
      expect(res.body.experiences).toHaveLength(0);
    });

    it("returns experiences filtered by companyId", async () => {
      const otherCompany = await createCompany("Other Company");
      await PlacementExperience.create({ company: company._id, studentName: "Alice", role: "SDE", outcome: "offered" });
      await PlacementExperience.create({ company: otherCompany._id, studentName: "Bob", role: "Analyst", outcome: "rejected" });
      const res = await request(app).get(`/api/experiences?companyId=${company._id}`).expect(200);
      expect(res.body.count).toBe(1);
      expect(res.body.experiences[0].studentName).toBe("Alice");
    });

    it("populates the company field in experiences", async () => {
      await PlacementExperience.create({ company: company._id, studentName: "Alice", role: "SDE" });
      const res = await request(app).get("/api/experiences").expect(200);
      expect(res.body.experiences[0].company).toBeDefined();
      expect(res.body.experiences[0].company.name).toBe("Test Company");
    });
  });

  describe("GET /api/experiences/:id", () => {
    it("returns a single experience by id", async () => {
      const exp = await PlacementExperience.create({ company: company._id, studentName: "Alice", role: "SDE", overallExperience: "Great process." });
      const res = await request(app).get(`/api/experiences/${exp._id}`).expect(200);
      expect(res.body.experience.studentName).toBe("Alice");
      expect(res.body.experience.overallExperience).toBe("Great process.");
    });

    it("returns 404 for a non-existent experience", async () => {
      await request(app).get("/api/experiences/507f1f77bcf86cd799439011").expect(404);
    });
  });

  describe("POST /api/experiences", () => {
    it("creates an experience when authenticated with valid data", async () => {
      const res = await request(app)
        .post("/api/experiences").set("Cookie", cookie)
        .send({ companyId: company._id.toString(), studentName: "Jane Doe", role: "Software Engineer", package: "8 LPA", outcome: "offered", difficulty: "medium", overallExperience: "Smooth process overall.", tips: "Practice DSA." })
        .expect(201);
      expect(res.body.experience.studentName).toBe("Jane Doe");
      expect(res.body.experience.role).toBe("Software Engineer");
      expect(res.body.experience.outcome).toBe("offered");
      expect(res.body.experience.company).toBeDefined();
      expect(res.body.experience.company.name).toBe("Test Company");
    });

    it("rejects submission without authentication", async () => {
      const res = await request(app)
        .post("/api/experiences").send({ companyId: company._id.toString(), studentName: "Anon", role: "SDE" })
        .expect(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    it("rejects submission with missing required fields", async () => {
      const res = await request(app)
        .post("/api/experiences").set("Cookie", cookie)
        .send({ companyId: company._id.toString(), studentName: "No Role" })
        .expect(400);
      expect(res.body.error).toMatch(/required/i);
    });

    it("rejects submission with an invalid companyId", async () => {
      const res = await request(app)
        .post("/api/experiences").set("Cookie", cookie)
        .send({ companyId: "507f1f77bcf86cd799439011", studentName: "Ghost", role: "SDE" })
        .expect(400);
      expect(res.body.error).toMatch(/company not found/i);
    });

    it("rejects submission with an invalid outcome value", async () => {
      const res = await request(app)
        .post("/api/experiences").set("Cookie", cookie)
        .send({ companyId: company._id.toString(), studentName: "Bad Outcome", role: "SDE", outcome: "maybe" })
        .expect(400);
      expect(res.body.error).toMatch(/outcome/i);
    });

    it("accepts rounds with questionsAsked", async () => {
      const res = await request(app)
        .post("/api/experiences").set("Cookie", cookie)
        .send({ companyId: company._id.toString(), studentName: "Round User", role: "SDE", rounds: [{ name: "Coding Round", type: "coding", difficulty: "medium", details: "2 DSA problems", questionsAsked: ["Two sum", "Reverse a linked list"] }] })
        .expect(201);
      expect(res.body.experience.rounds).toHaveLength(1);
      expect(res.body.experience.rounds[0].questionsAsked).toEqual(["Two sum", "Reverse a linked list"]);
    });

    it("rejects duplicate experience (same company + studentName)", async () => {
      await request(app).post("/api/experiences").set("Cookie", cookie)
        .send({ companyId: company._id.toString(), studentName: "Duplicate Person", role: "SDE" }).expect(201);
      const res = await request(app).post("/api/experiences").set("Cookie", cookie)
        .send({ companyId: company._id.toString(), studentName: "Duplicate Person", role: "SDE" }).expect(409);
      expect(res.body.error).toMatch(/already exists/i);
    });
  });
});
