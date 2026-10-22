import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Student from "../src/models/Student.js";
import { connectDB } from "../src/config/db.js";

let mongoServer;

/**
 * Starts an in-memory MongoDB, connects Mongoose via the app's connectDB
 * (so the internal isConnected flag that requireDb checks is set), and
 * provides helpers for seeding and cleaning data.
 */
export async function setupTestDb() {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = "test-secret-very-long-string-for-testing-only";
  await connectDB();
}

export async function teardownTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function clearDb() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

/**
 * Creates a student directly in the DB (bypassing the API) and returns the
 * plain object plus the raw password for use in login tests.
 */
export async function createTestStudent(
  { name = "Test User", email = "test@example.edu", password = "Password1", role = "student" } = {}
) {
  const passwordHash = await bcrypt.hash(password, 10);
  const student = await Student.create({ name, email: email.toLowerCase(), passwordHash, role });
  return { student, password };
}
