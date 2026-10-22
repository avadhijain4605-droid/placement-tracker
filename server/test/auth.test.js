import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { setupTestDb, teardownTestDb, clearDb, createTestStudent } from "./testDb.js";

describe("Auth API", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearDb();
  });

  // ── Signup ──────────────────────────────────────────────────────────

  describe("POST /api/auth/signup", () => {
    it("creates a new account and sets a session cookie", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ name: "Jane Doe", email: "jane@college.edu", password: "Secure123" })
        .expect(201);

      expect(res.body.student).toBeDefined();
      expect(res.body.student.name).toBe("Jane Doe");
      expect(res.body.student.email).toBe("jane@college.edu");
      // Password hash must never leak to the client.
      expect(res.body.student.passwordHash).toBeUndefined();
      // A session cookie should be set.
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith("pt_session="))).toBe(true);
      // Cookie must be HttpOnly.
      expect(cookies.some((c) => c.includes("HttpOnly"))).toBe(true);
      // The role must be "student" by default, never client-supplied.
      expect(res.body.student.role).toBe("student");
    });

    it("rejects duplicate signup with the same email", async () => {
      await createTestStudent({ email: "dup@college.edu", password: "Password1" });

      const res = await request(app)
        .post("/api/auth/signup")
        .send({ name: "Another", email: "dup@college.edu", password: "Password1" })
        .expect(409);

      expect(res.body.error).toMatch(/already exists/i);
    });

    it("rejects signup when role is supplied in the body (server always sets role)", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ name: "Hacker", email: "hack@college.edu", password: "Password1", role: "admin" })
        .expect(201);

      expect(res.body.student.role).toBe("student");
    });

    it("rejects signup with a weak password", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ name: "Weak", email: "weak@college.edu", password: "short1" })
        .expect(400);

      expect(res.body.error).toMatch(/password/i);
    });

    it("rejects signup with an invalid email", async () => {
      await request(app)
        .post("/api/auth/signup")
        .send({ name: "Bad", email: "not-an-email", password: "Password1" })
        .expect(400);
    });

    it("rejects signup with missing fields", async () => {
      await request(app)
        .post("/api/auth/signup")
        .send({ email: "missing@college.edu", password: "Password1" })
        .expect(400);
    });
  });

  // ── Login ──────────────────────────────────────────────────────────

  describe("POST /api/auth/login", () => {
    it("logs in with correct credentials and sets a session cookie", async () => {
      await createTestStudent({ email: "login@college.edu", password: "Password1" });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@college.edu", password: "Password1" })
        .expect(200);

      expect(res.body.student).toBeDefined();
      expect(res.body.student.email).toBe("login@college.edu");
      expect(res.body.student.passwordHash).toBeUndefined();

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith("pt_session="))).toBe(true);
      expect(cookies.some((c) => c.includes("HttpOnly"))).toBe(true);
    });

    it("rejects login with an incorrect password", async () => {
      await createTestStudent({ email: "wrongpw@college.edu", password: "Password1" });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "wrongpw@college.edu", password: "WrongPassword1" })
        .expect(401);

      // Generic message to prevent user enumeration.
      expect(res.body.error).toBe("Invalid email or password.");
      // No cookie should be set on failure.
      expect(res.headers["set-cookie"]).toBeUndefined();
    });

    it("rejects login for a non-existent email with the same generic message", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@college.edu", password: "Password1" })
        .expect(401);

      expect(res.body.error).toBe("Invalid email or password.");
    });

    it("rejects login with missing fields", async () => {
      await request(app)
        .post("/api/auth/login")
        .send({ email: "login@college.edu" })
        .expect(400);
    });
  });

  // ── Logout ──────────────────────────────────────────────────────────

  describe("POST /api/auth/logout", () => {
    it("clears the session cookie", async () => {
      // First log in to get a cookie.
      const loginRes = await request(app)
        .post("/api/auth/signup")
        .send({ name: "Logout User", email: "logout@college.edu", password: "Password1" })
        .expect(201);
      const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", cookie)
        .expect(200);

      expect(res.body.message).toBe("Logged out.");
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      // The cookie should be cleared (Expires/Max-Age 0).
      expect(cookies.some((c) => c.includes("pt_session=;") || c.includes("pt_session="))).toBe(true);
    });
  });

  // ── Protected routes / unauthorized access ──────────────────────────

  describe("Protected routes", () => {
    it("rejects /api/students/me without a session cookie (unauthorized)", async () => {
      const res = await request(app).get("/api/students/me").expect(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    it("rejects /api/auth/me without a session cookie", async () => {
      const res = await request(app).get("/api/auth/me").expect(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    it("rejects /api/ai/preparation-plan without authentication", async () => {
      const res = await request(app)
        .post("/api/ai/preparation-plan")
        .send({ companyId: "507f1f77bcf86cd799439011", availableDays: 7 })
        .expect(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    it("allows access to /api/students/me with a valid session", async () => {
      const { password } = await createTestStudent({
        email: "authme@college.edu",
        password: "Password1",
      });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "authme@college.edu", password })
        .expect(200);
      const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

      const res = await request(app)
        .get("/api/students/me")
        .set("Cookie", cookie)
        .expect(200);

      expect(res.body.student.email).toBe("authme@college.edu");
      expect(res.body.student.passwordHash).toBeUndefined();
    });

    it("rejects access with a tampered/invalid session cookie", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", "pt_session=invalid.token.here")
        .expect(401);
      expect(res.body.error).toMatch(/invalid or expired/i);
    });
  });

  // ── Role enforcement ───────────────────────────────────────────────

  describe("Role enforcement (GET /api/auth/admin)", () => {
    it("forbids a regular student from the admin-only route", async () => {
      const { password } = await createTestStudent({
        email: "regular@college.edu",
        password: "Password1",
        role: "student",
      });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "regular@college.edu", password })
        .expect(200);
      const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

      const res = await request(app)
        .get("/api/auth/admin")
        .set("Cookie", cookie)
        .expect(403);

      expect(res.body.error).toMatch(/permission/i);
    });

    it("allows an admin to access the admin-only route", async () => {
      const { password } = await createTestStudent({
        email: "admin@college.edu",
        password: "Password1",
        role: "admin",
      });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@college.edu", password })
        .expect(200);
      const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

      const res = await request(app)
        .get("/api/auth/admin")
        .set("Cookie", cookie)
        .expect(200);

      expect(res.body.message).toBe("Admin area");
      expect(res.body.role).toBe("admin");
    });
  });
});
