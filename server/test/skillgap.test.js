import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { setupTestDb, teardownTestDb, clearDb, createTestStudent } from "./testDb.js";
import Student from "../src/models/Student.js";
import Company from "../src/models/Company.js";
import PrepProgress from "../src/models/PrepProgress.js";
import {
  normalizeSkill,
  matchSkills,
  checkEligibility,
  computeReadiness,
  buildPrepTasks,
  analyzeSkillGap,
} from "../src/services/skillGap.js";

async function loginUser(email, password) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.headers["set-cookie"][0].split(";")[0];
}

describe("Skill Gap Service", () => {
  describe("normalizeSkill", () => {
    it("lowercases and trims", () => {
      expect(normalizeSkill("  JavaScript ")).toBe("javascript");
    });

    it("maps common aliases", () => {
      expect(normalizeSkill("JS")).toBe("javascript");
      expect(normalizeSkill("C++")).toBe("cpp");
      expect(normalizeSkill("Node.js")).toBe("nodejs");
      expect(normalizeSkill("Data Structures and Algorithms")).toBe("dsa");
    });

    it("returns empty for falsy input", () => {
      expect(normalizeSkill("")).toBe("");
      expect(normalizeSkill(null)).toBe("");
      expect(normalizeSkill(undefined)).toBe("");
    });
  });

  describe("matchSkills", () => {
    it("matches with alias normalization", () => {
      const { matched, missing } = matchSkills(
        ["JavaScript", "Python", "React"],
        ["JS", "Java", "React.js"]
      );
      expect(matched).toEqual(expect.arrayContaining(["JS", "React.js"]));
      expect(matched).toHaveLength(2);
      expect(missing).toEqual(["Java"]);
    });

    it("returns all missing when student has none of the required", () => {
      const { matched, missing } = matchSkills([], ["Python", "Java"]);
      expect(matched).toHaveLength(0);
      expect(missing).toHaveLength(2);
    });

    it("returns all matched when student has everything", () => {
      const { matched, missing } = matchSkills(
        ["Python", "Java", "SQL"],
        ["Python", "Java"]
      );
      expect(matched).toHaveLength(2);
      expect(missing).toHaveLength(0);
    });

    it("handles empty company skills", () => {
      const { matched, missing } = matchSkills(["Python"], []);
      expect(matched).toHaveLength(0);
      expect(missing).toHaveLength(0);
    });
  });

  describe("computeReadiness", () => {
    it("returns 100 when all skills matched", () => {
      expect(computeReadiness(["Python", "Java"], [])).toBe(100);
    });

    it("returns 0 when no skills matched", () => {
      expect(computeReadiness([], ["Python", "Java"])).toBe(0);
    });

    it("returns 50 when half matched", () => {
      expect(computeReadiness(["Python"], ["Java"])).toBe(50);
    });

    it("returns null when no required skills", () => {
      expect(computeReadiness([], [])).toBeNull();
    });
  });

  describe("checkEligibility", () => {
    it("checks CGPA pass", () => {
      const student = { cgpa: 8.5 };
      const company = { eligibilityCriteria: { minCgpa: 7 } };
      const results = checkEligibility(student, company);
      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
      expect(results[0].detail).toContain("8.5");
    });

    it("checks CGPA fail", () => {
      const student = { cgpa: 5.5 };
      const company = { eligibilityCriteria: { minCgpa: 7 } };
      const results = checkEligibility(student, company);
      expect(results[0].passed).toBe(false);
    });

    it("checks CGPA missing from profile", () => {
      const student = {};
      const company = { eligibilityCriteria: { minCgpa: 7 } };
      const results = checkEligibility(student, company);
      expect(results[0].passed).toBe(false);
      expect(results[0].detail).toMatch(/not set/i);
    });

    it("checks graduation year", () => {
      const student = { graduationYear: 2025 };
      const company = { eligibilityCriteria: { graduationYear: [2024, 2025] } };
      const results = checkEligibility(student, company);
      expect(results[0].passed).toBe(true);
    });

    it("checks graduation year fail", () => {
      const student = { graduationYear: 2026 };
      const company = { eligibilityCriteria: { graduationYear: [2024, 2025] } };
      const results = checkEligibility(student, company);
      expect(results[0].passed).toBe(false);
    });

    it("checks branch", () => {
      const student = { branch: "CSE" };
      const company = { eligibilityCriteria: { allowedBranches: ["CSE", "IT"] } };
      const results = checkEligibility(student, company);
      expect(results[0].passed).toBe(true);
    });

    it("checks backlog not allowed", () => {
      const student = { backlogs: 1 };
      const company = { eligibilityCriteria: { backlogAllowed: false } };
      const results = checkEligibility(student, company);
      expect(results[0].passed).toBe(false);
    });

    it("returns empty array when no criteria set", () => {
      const results = checkEligibility({ cgpa: 8 }, {});
      expect(results).toHaveLength(0);
    });
  });

  describe("buildPrepTasks", () => {
    it("builds tasks for missing skills", () => {
      const company = { oaPatterns: [], interviewQuestions: [], preparationResources: [] };
      const tasks = buildPrepTasks(["Python", "Docker"], company);
      expect(tasks).toHaveLength(2);
      expect(tasks[0].priority).toBe("medium");
      expect(tasks[0].reason).toContain("Python");
    });

    it("marks as high priority when skill appears in OA topics", () => {
      const company = {
        oaPatterns: [{ topics: ["Python", "Arrays"] }],
        interviewQuestions: [],
        preparationResources: [],
      };
      const tasks = buildPrepTasks(["Python", "Docker"], company);
      const pythonTask = tasks.find((t) => t.skill === "Python");
      const dockerTask = tasks.find((t) => t.skill === "Docker");
      expect(pythonTask.priority).toBe("high");
      expect(dockerTask.priority).toBe("medium");
    });

    it("returns empty for no missing skills", () => {
      expect(buildPrepTasks([], {})).toEqual([]);
    });
  });

  describe("analyzeSkillGap", () => {
    it("returns complete analysis object", () => {
      const student = { skills: ["JavaScript", "Python"], cgpa: 8.5, graduationYear: 2025 };
      const company = {
        name: "TestCo",
        requiredSkills: ["JS", "Java", "Python"],
        eligibilityCriteria: { minCgpa: 7, graduationYear: [2025] },
        oaPatterns: [{ topics: ["Java"] }],
        interviewQuestions: [],
        preparationResources: [],
      };

      const result = analyzeSkillGap(student, company);
      expect(result.companyName).toBe("TestCo");
      expect(result.matched).toEqual(expect.arrayContaining(["JS", "Python"]));
      expect(result.missing).toEqual(["Java"]);
      expect(result.readiness).toBe(67);
      expect(result.eligibility).toHaveLength(2);
      expect(result.eligibilityPassed).toBe(true);
      expect(result.prepTasks).toHaveLength(1);
      expect(result.prepTasks[0].skill).toBe("Java");
      expect(result.prepTasks[0].priority).toBe("high");
    });
  });
});

// ── API tests ──────────────────────────────────────────────────────
describe("Skill Gap API", () => {
  let cookie;
  let testCompanyId;

  beforeAll(async () => {
    await setupTestDb();
    const { student, password } = await createTestStudent({
      email: "skillgap@college.edu",
      password: "Password1",
    });
    await Student.findByIdAndUpdate(student._id, {
      skills: ["JavaScript", "Python", "React"],
      cgpa: 8.2,
      graduationYear: 2025,
      backlogs: 0,
    });
    cookie = await loginUser("skillgap@college.edu", "Password1");
  });

  afterAll(async () => { await teardownTestDb(); });

  beforeEach(async () => {
    await PrepProgress.deleteMany({});
    await Company.deleteMany({});
    const company = await Company.create({
      name: "TestCorp",
      industry: "IT",
      requiredSkills: ["JavaScript", "Java", "Docker", "Python"],
      eligibilityCriteria: {
        minCgpa: 7,
        graduationYear: [2024, 2025],
        backlogAllowed: false,
      },
      oaPatterns: [{ round: "Coding OA", topics: ["Java", "Docker"], difficulty: "medium" }],
      interviewQuestions: [{ question: "Explain Docker", type: "technical", round: "Technical" }],
      preparationResources: [{ title: "Docker Basics", type: "article", topic: "Docker" }],
      active: true,
    });
    testCompanyId = company._id.toString();
  });

  describe("POST /api/ai/skill-gap", () => {
    it("returns analysis with matched and missing skills", async () => {
      const res = await request(app)
        .post("/api/ai/skill-gap").set("Cookie", cookie)
        .send({ companyId: testCompanyId })
        .expect(200);

      expect(res.body.analysis.companyName).toBe("TestCorp");
      expect(res.body.analysis.matched).toEqual(expect.arrayContaining(["JavaScript", "Python"]));
      expect(res.body.analysis.missing).toEqual(expect.arrayContaining(["Java", "Docker"]));
      expect(res.body.analysis.readiness).toBe(50);
      expect(res.body.analysis.readinessFormula).toContain("2 matched");
      expect(res.body.progressId).toBeDefined();
    });

    it("returns eligibility checks with pass/fail", async () => {
      const res = await request(app)
        .post("/api/ai/skill-gap").set("Cookie", cookie)
        .send({ companyId: testCompanyId })
        .expect(200);

      const elig = res.body.analysis.eligibility;
      expect(elig).toHaveLength(3);
      const cgpa = elig.find((e) => e.criterion === "CGPA");
      expect(cgpa.passed).toBe(true);
      expect(cgpa.detail).toContain("8.2");
      const year = elig.find((e) => e.criterion === "Graduation Year");
      expect(year.passed).toBe(true);
      const backlog = elig.find((e) => e.criterion === "Backlogs");
      expect(backlog.passed).toBe(true);
    });

    it("returns prioritized prep tasks with explanations", async () => {
      const res = await request(app)
        .post("/api/ai/skill-gap").set("Cookie", cookie)
        .send({ companyId: testCompanyId })
        .expect(200);

      const tasks = res.body.analysis.prepTasks;
      expect(tasks).toHaveLength(2);
      const dockerTask = tasks.find((t) => t.skill === "Docker");
      expect(dockerTask.priority).toBe("high");
      expect(dockerTask.reason).toContain("assessment");
      expect(dockerTask.resourceTitles).toContain("Docker Basics");
    });

    it("persists progress to the database", async () => {
      await request(app)
        .post("/api/ai/skill-gap").set("Cookie", cookie)
        .send({ companyId: testCompanyId })
        .expect(200);

      const count = await PrepProgress.countDocuments({ companyId: testCompanyId });
      expect(count).toBe(1);
    });

    it("upserts on re-analysis (no duplicates)", async () => {
      await request(app).post("/api/ai/skill-gap").set("Cookie", cookie).send({ companyId: testCompanyId }).expect(200);
      await request(app).post("/api/ai/skill-gap").set("Cookie", cookie).send({ companyId: testCompanyId }).expect(200);

      const count = await PrepProgress.countDocuments({ companyId: testCompanyId });
      expect(count).toBe(1);
    });

    it("requires authentication", async () => {
      const res = await request(app)
        .post("/api/ai/skill-gap").send({ companyId: testCompanyId })
        .expect(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    it("requires companyId", async () => {
      const res = await request(app)
        .post("/api/ai/skill-gap").set("Cookie", cookie)
        .send({})
        .expect(400);
      expect(res.body.error).toMatch(/companyId is required/i);
    });

    it("returns 404 for non-existent company", async () => {
      const res = await request(app)
        .post("/api/ai/skill-gap").set("Cookie", cookie)
        .send({ companyId: "507f1f77bcf86cd799439011" })
        .expect(404);
      expect(res.body.error).toMatch(/company not found/i);
    });
  });

  describe("GET /api/ai/progress", () => {
    it("returns the student's saved analyses", async () => {
      await request(app)
        .post("/api/ai/skill-gap").set("Cookie", cookie)
        .send({ companyId: testCompanyId })
        .expect(200);

      const res = await request(app)
        .get("/api/ai/progress").set("Cookie", cookie)
        .expect(200);

      expect(res.body.count).toBe(1);
      expect(res.body.progress[0].companyId.name).toBe("TestCorp");
      expect(res.body.progress[0].readiness).toBe(50);
      expect(res.body.progress[0].tasks).toHaveLength(2);
    });

    it("returns empty list when no analyses saved", async () => {
      const res = await request(app)
        .get("/api/ai/progress").set("Cookie", cookie)
        .expect(200);
      expect(res.body.count).toBe(0);
    });

    it("requires authentication", async () => {
      const res = await request(app)
        .get("/api/ai/progress")
        .expect(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });
  });

  describe("PUT /api/ai/progress/:id/toggle", () => {
    it("toggles a task done status", async () => {
      const createRes = await request(app)
        .post("/api/ai/skill-gap").set("Cookie", cookie)
        .send({ companyId: testCompanyId })
        .expect(200);

      const progressId = createRes.body.progressId;

      // Fetch the persisted progress to get task _ids (analysis prepTasks don't have _ids).
      const progressRes = await request(app)
        .get("/api/ai/progress").set("Cookie", cookie)
        .expect(200);
      const taskId = String(progressRes.body.progress[0].tasks[0]._id);

      const toggleRes = await request(app)
        .put(`/api/ai/progress/${progressId}/toggle`).set("Cookie", cookie)
        .send({ taskId })
        .expect(200);

      expect(toggleRes.body.task.done).toBe(true);

      // Toggle back.
      const toggleRes2 = await request(app)
        .put(`/api/ai/progress/${progressId}/toggle`).set("Cookie", cookie)
        .send({ taskId })
        .expect(200);

      expect(toggleRes2.body.task.done).toBe(false);
    });

    it("requires authentication", async () => {
      const res = await request(app)
        .put("/api/ai/progress/507f1f77bcf86cd799439011/toggle")
        .send({ taskId: "someid" })
        .expect(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });
  });

  describe("Incomplete profile", () => {
    let incompleteCookie;
    let incompleteStudent;

    beforeAll(async () => {
      const { student, password } = await createTestStudent({
        email: "noprofile@college.edu",
        password: "Password1",
      });
      incompleteStudent = student;
      incompleteCookie = await loginUser("noprofile@college.edu", "Password1");
    });

    it("skill-gap still works with no skills (returns all missing)", async () => {
      // Skill-gap is deterministic — it should work even with an incomplete profile,
      // showing all skills as missing and eligibility as failing.
      const res = await request(app)
        .post("/api/ai/skill-gap").set("Cookie", incompleteCookie)
        .send({ companyId: testCompanyId })
        .expect(200);

      expect(res.body.analysis.matched).toHaveLength(0);
      expect(res.body.analysis.missing).toHaveLength(4);
      expect(res.body.analysis.readiness).toBe(0);
      expect(res.body.analysis.eligibilityPassed).toBe(false);
    });

    it("AI prep plan rejects incomplete profile", async () => {
      const res = await request(app)
        .post("/api/ai/preparation-plan").set("Cookie", incompleteCookie)
        .send({ companyId: testCompanyId, availableDays: 7 })
        .expect(400);

      expect(res.body.error).toMatch(/profile is incomplete/i);
      expect(res.body.missing).toContain("skills");
    });
  });
});
