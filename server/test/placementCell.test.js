import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { setupTestDb, teardownTestDb, clearDb, createTestStudent } from "./testDb.js";
import Company from "../src/models/Company.js";
import PlacementDrive from "../src/models/PlacementDrive.js";
import PlacementApplication from "../src/models/PlacementApplication.js";

async function loginAndGetCookie(email, password) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.headers["set-cookie"][0].split(";")[0];
}

describe("Placement Cell Module", () => {
  let studentCookie, adminCookie, superAdminCookie;
  let studentId, adminId, superAdminId;
  let companyId, driveId;

  beforeAll(async () => {
    await setupTestDb();

    const s = await createTestStudent({ email: "student@college.edu", password: "Password1", role: "student" });
    studentId = s.student._id;
    const a = await createTestStudent({ email: "admin@college.edu", password: "Password1", role: "admin" });
    adminId = a.student._id;
    const sa = await createTestStudent({ email: "superadmin@college.edu", password: "Password1", role: "super_admin" });
    superAdminId = sa.student._id;

    studentCookie = await loginAndGetCookie("student@college.edu", "Password1");
    adminCookie = await loginAndGetCookie("admin@college.edu", "Password1");
    superAdminCookie = await loginAndGetCookie("superadmin@college.edu", "Password1");
  });

  afterAll(async () => { await teardownTestDb(); });

  beforeEach(async () => {
    await Company.deleteMany({});
    await PlacementDrive.deleteMany({});
    await PlacementApplication.deleteMany({});

    const company = await Company.create({
      name: "TestCorp",
      industry: "IT",
      headquarters: "Bengaluru",
      requiredSkills: ["JavaScript", "React"],
      active: true,
    });
    companyId = company._id;

    const drive = await PlacementDrive.create({
      company: companyId,
      jobTitle: "Software Engineer",
      jobType: "full-time",
      workMode: "onsite",
      applicationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "published",
      eligibility: { minCgpa: 7, graduationYear: [2025, 2026], backlogAllowed: false },
      package: { minAmount: 8, maxAmount: 12, currency: "INR", period: "lpa" },
    });
    driveId = drive._id;
  });

  // ── Drive visibility ──────────────────────────────────────────────

  describe("Drive visibility", () => {
    it("student sees only published drives", async () => {
      await PlacementDrive.create({
        company: companyId,
        jobTitle: "Draft Role",
        applicationDeadline: new Date(Date.now() + 86400000),
        status: "draft",
      });
      const res = await request(app).get("/api/drives").set("Cookie", studentCookie).expect(200);
      expect(res.body.count).toBe(1);
      expect(res.body.drives[0].jobTitle).toBe("Software Engineer");
    });

    it("admin sees all drives including drafts", async () => {
      await PlacementDrive.create({
        company: companyId,
        jobTitle: "Draft Role",
        applicationDeadline: new Date(Date.now() + 86400000),
        status: "draft",
      });
      const res = await request(app).get("/api/drives").set("Cookie", adminCookie).expect(200);
      expect(res.body.count).toBe(2);
    });

    it("student cannot view a draft drive", async () => {
      const draft = await PlacementDrive.create({
        company: companyId,
        jobTitle: "Secret Role",
        applicationDeadline: new Date(Date.now() + 86400000),
        status: "draft",
      });
      await request(app).get(`/api/drives/${draft._id}`).set("Cookie", studentCookie).expect(404);
    });

    it("student gets eligibility on drive detail", async () => {
      const res = await request(app).get(`/api/drives/${driveId}`).set("Cookie", studentCookie).expect(200);
      expect(res.body.drive).toBeDefined();
      expect(res.body.eligibility).toBeDefined();
      // Student has no CGPA set, so should be undetermined
      expect(res.body.eligibility.undetermined).toBe(true);
    });
  });

  // ── Drive CRUD (admin only) ───────────────────────────────────────

  describe("Drive CRUD", () => {
    it("admin can create a drive", async () => {
      const res = await request(app)
        .post("/api/drives").set("Cookie", adminCookie)
        .send({
          companyId: companyId.toString(),
          jobTitle: "Data Analyst",
          jobType: "full-time",
          applicationDeadline: "2026-12-31",
          status: "draft",
        })
        .expect(201);
      expect(res.body.drive.jobTitle).toBe("Data Analyst");
      expect(res.body.drive.status).toBe("draft");
    });

    it("student cannot create a drive", async () => {
      await request(app)
        .post("/api/drives").set("Cookie", studentCookie)
        .send({ companyId: companyId.toString(), jobTitle: "Hack", applicationDeadline: "2026-12-31" })
        .expect(403);
    });

    it("rejects drive creation without required fields", async () => {
      await request(app)
        .post("/api/drives").set("Cookie", adminCookie)
        .send({ companyId: companyId.toString() })
        .expect(400);
    });

    it("admin can change drive status", async () => {
      const res = await request(app)
        .put(`/api/drives/${driveId}/status`).set("Cookie", adminCookie)
        .send({ status: "closed" })
        .expect(200);
      expect(res.body.drive.status).toBe("closed");
    });

    it("admin can archive a drive (soft delete)", async () => {
      const res = await request(app)
        .delete(`/api/drives/${driveId}`).set("Cookie", adminCookie)
        .expect(200);
      expect(res.body.drive.status).toBe("archived");
    });

    it("validates open date before deadline", async () => {
      await request(app)
        .post("/api/drives").set("Cookie", adminCookie)
        .send({
          companyId: companyId.toString(),
          jobTitle: "Bad Dates",
          applicationOpenDate: "2026-12-31",
          applicationDeadline: "2026-01-01",
        })
        .expect(400);
    });
  });

  // ── Applications ──────────────────────────────────────────────────

  describe("Applications", () => {
    it("student can apply to a published drive", async () => {
      const res = await request(app)
        .post("/api/applications").set("Cookie", studentCookie)
        .send({ driveId: driveId.toString() })
        .expect(201);
      expect(res.body.application.status).toBe("applied");
    });

    it("student cannot apply twice to the same drive", async () => {
      await request(app).post("/api/applications").set("Cookie", studentCookie).send({ driveId: driveId.toString() }).expect(201);
      await request(app).post("/api/applications").set("Cookie", studentCookie).send({ driveId: driveId.toString() }).expect(409);
    });

    it("student sees only their own applications", async () => {
      await request(app).post("/api/applications").set("Cookie", studentCookie).send({ driveId: driveId.toString() }).expect(201);
      const res = await request(app).get("/api/applications").set("Cookie", studentCookie).expect(200);
      expect(res.body.count).toBe(1);
      expect(res.body.applications[0].student.email).toBe("student@college.edu");
    });

    it("admin can view all applications", async () => {
      await request(app).post("/api/applications").set("Cookie", studentCookie).send({ driveId: driveId.toString() }).expect(201);
      const res = await request(app).get("/api/applications").set("Cookie", adminCookie).expect(200);
      expect(res.body.count).toBe(1);
    });

    it("admin can update application status", async () => {
      const applyRes = await request(app).post("/api/applications").set("Cookie", studentCookie).send({ driveId: driveId.toString() }).expect(201);
      const appId = applyRes.body.application._id;
      const res = await request(app)
        .put(`/api/applications/${appId}/status`).set("Cookie", adminCookie)
        .send({ status: "shortlisted", note: "Good profile" })
        .expect(200);
      expect(res.body.application.status).toBe("shortlisted");
      expect(res.body.application.statusHistory).toHaveLength(2);
    });

    it("student cannot update application status (only admin)", async () => {
      const applyRes = await request(app).post("/api/applications").set("Cookie", studentCookie).send({ driveId: driveId.toString() }).expect(201);
      const appId = applyRes.body.application._id;
      await request(app)
        .put(`/api/applications/${appId}/status`).set("Cookie", studentCookie)
        .send({ status: "selected" })
        .expect(403);
    });

    it("student can withdraw their own application", async () => {
      const applyRes = await request(app).post("/api/applications").set("Cookie", studentCookie).send({ driveId: driveId.toString() }).expect(201);
      const appId = applyRes.body.application._id;
      const res = await request(app)
        .put(`/api/applications/${appId}/withdraw`).set("Cookie", studentCookie)
        .expect(200);
      expect(res.body.application.status).toBe("withdrawn");
    });

    it("student cannot apply to a closed drive", async () => {
      await request(app).put(`/api/drives/${driveId}/status`).set("Cookie", adminCookie).send({ status: "closed" }).expect(200);
      await request(app)
        .post("/api/applications").set("Cookie", studentCookie)
        .send({ driveId: driveId.toString() })
        .expect(400);
    });
  });

  // ── Admin dashboard & user management ─────────────────────────────

  describe("Admin dashboard", () => {
    it("admin can access dashboard stats", async () => {
      const res = await request(app).get("/api/admin/dashboard").set("Cookie", adminCookie).expect(200);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalCompanies).toBeGreaterThan(0);
      expect(res.body.stats.activeDrives).toBeGreaterThan(0);
    });

    it("student cannot access admin dashboard", async () => {
      await request(app).get("/api/admin/dashboard").set("Cookie", studentCookie).expect(403);
    });
  });

  describe("User management (super_admin only)", () => {
    it("super_admin can list users", async () => {
      const res = await request(app).get("/api/admin/users").set("Cookie", superAdminCookie).expect(200);
      expect(res.body.count).toBeGreaterThan(0);
    });

    it("admin cannot list users (only super_admin)", async () => {
      await request(app).get("/api/admin/users").set("Cookie", adminCookie).expect(403);
    });

    it("super_admin can change a user's role", async () => {
      const res = await request(app)
        .put(`/api/admin/users/${studentId}/role`).set("Cookie", superAdminCookie)
        .send({ role: "admin" })
        .expect(200);
      expect(res.body.user.role).toBe("admin");
    });

    it("super_admin cannot demote themselves", async () => {
      await request(app)
        .put(`/api/admin/users/${superAdminId}/role`).set("Cookie", superAdminCookie)
        .send({ role: "admin" })
        .expect(400);
    });

    it("student cannot access audit logs", async () => {
      await request(app).get("/api/admin/audit").set("Cookie", studentCookie).expect(403);
    });

    it("admin cannot access audit logs (only super_admin)", async () => {
      await request(app).get("/api/admin/audit").set("Cookie", adminCookie).expect(403);
    });
  });

  // ── Announcements ─────────────────────────────────────────────────

  describe("Announcements", () => {
    it("admin can create an announcement", async () => {
      const res = await request(app)
        .post("/api/announcements").set("Cookie", adminCookie)
        .send({ title: "Test Announcement", content: "This is a test.", category: "general", published: true })
        .expect(201);
      expect(res.body.announcement.title).toBe("Test Announcement");
      expect(res.body.announcement.published).toBe(true);
    });

    it("student cannot create an announcement", async () => {
      await request(app)
        .post("/api/announcements").set("Cookie", studentCookie)
        .send({ title: "Hack", content: "Hacked" })
        .expect(403);
    });

    it("student sees only published announcements", async () => {
      await request(app)
        .post("/api/announcements").set("Cookie", adminCookie)
        .send({ title: "Published One", content: "Visible", published: true }).expect(201);
      await request(app)
        .post("/api/announcements").set("Cookie", adminCookie)
        .send({ title: "Draft One", content: "Hidden", published: false }).expect(201);

      const res = await request(app).get("/api/announcements").set("Cookie", studentCookie).expect(200);
      expect(res.body.count).toBe(1);
      expect(res.body.announcements[0].title).toBe("Published One");
    });
  });

  // ── Company management (admin) ────────────────────────────────────

  describe("Company management", () => {
    it("admin can update a company", async () => {
      const res = await request(app)
        .put(`/api/companies/${companyId}`).set("Cookie", adminCookie)
        .send({ description: "Updated description" })
        .expect(200);
      expect(res.body.company.description).toBe("Updated description");
    });

    it("student cannot update a company", async () => {
      await request(app)
        .put(`/api/companies/${companyId}`).set("Cookie", studentCookie)
        .send({ description: "Hack" })
        .expect(403);
    });

    it("admin can archive a company", async () => {
      const res = await request(app)
        .put(`/api/companies/${companyId}/archive`).set("Cookie", adminCookie)
        .expect(200);
      expect(res.body.company.archived).toBe(true);
    });

    it("student cannot see recruiter contact", async () => {
      await Company.findByIdAndUpdate(companyId, {
        recruiterContact: { name: "John", email: "john@testcorp.com", phone: "1234567890" },
      });
      const res = await request(app).get(`/api/companies/${companyId}`).set("Cookie", studentCookie).expect(200);
      expect(res.body.company.recruiterContact).toBeUndefined();
    });

    it("admin can see recruiter contact", async () => {
      await Company.findByIdAndUpdate(companyId, {
        recruiterContact: { name: "John", email: "john@testcorp.com", phone: "1234567890" },
      });
      const res = await request(app).get(`/api/companies/${companyId}`).set("Cookie", adminCookie).expect(200);
      expect(res.body.company.recruiterContact).toBeDefined();
      expect(res.body.company.recruiterContact.name).toBe("John");
    });
  });

  // ── Role enforcement on signup ────────────────────────────────────

  describe("Role enforcement", () => {
    it("signup always creates a student role, even if admin is supplied", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ name: "New User", email: "newuser@college.edu", password: "Password1", role: "admin" })
        .expect(201);
      expect(res.body.student.role).toBe("student");
    });
  });
});
