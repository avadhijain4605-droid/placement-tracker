import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { connectDB } from "./config/db.js";
import Student from "./models/Student.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: "../.env" });
dotenv.config();

async function run() {
  const email = process.argv.find((a) => a.startsWith("--email="))?.split("=")[1];
  const name = process.argv.find((a) => a.startsWith("--name="))?.split("=")[1] || "Super Admin";

  if (!email) {
    console.error("Usage: node src/createSuperAdmin.js --email=admin@college.edu [--name='Super Admin']");
    console.error("You will be prompted for a password interactively.");
    process.exit(1);
  }

  const conn = await connectDB();
  if (!conn) {
    console.error("Could not connect to MongoDB. Check MONGODB_URI.");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await Student.findOne({ email: normalizedEmail });

  if (existing) {
    if (existing.role === "super_admin") {
      console.log(`User ${normalizedEmail} is already a super_admin.`);
    } else {
      existing.role = "super_admin";
      await existing.save();
      console.log(`Updated ${normalizedEmail} to super_admin.`);
    }
    await mongoose.connection.close();
    return;
  }

  const password = await new Promise((resolve) => {
    process.stdout.write("Enter password for super admin (min 8 chars): ");
    process.stdin.resume();
    process.stdin.setEncoding("utf-8");
    process.stdin.once("data", (data) => {
      process.stdout.write("\n");
      resolve(data.trim());
    });
  });

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    await mongoose.connection.close();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const student = await Student.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "super_admin",
  });

  console.log(`Super admin created: ${student.email} (id: ${student._id})`);
  await mongoose.connection.close();
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
