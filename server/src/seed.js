import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import Company from "./models/Company.js";
import PlacementExperience from "./models/PlacementExperience.js";

dotenv.config();
dotenv.config({ path: "../.env" });

const companies = [
  {
    name: "NovaTech Solutions",
    website: "https://example.com/novatech",
    industry: "IT Services",
    headquarters: "Bengaluru, India",
    description:
      "A mid-sized product engineering company building cloud and data platforms for fintech clients.",
    roles: [
      {
        title: "Software Engineer",
        package: "8.5 LPA",
        location: "Bengaluru",
        eligibility: "CGPA >= 7.0, CSE/IT/ECE",
      },
    ],
    eligibilityCriteria: { minCgpa: 7, allowedBranches: ["CSE", "IT", "ECE"], backlogAllowed: true },
    hiringProcess: ["Aptitude Test", "Coding Round", "Technical Interview", "HR Round"],
    active: true,
  },
  {
    name: "CloudPeak Systems",
    website: "https://example.com/cloudpeak",
    industry: "Cloud Infrastructure",
    headquarters: "Hyderabad, India",
    description: "Cloud infrastructure and DevOps tooling company serving global enterprises.",
    roles: [
      {
        title: "DevOps Engineer",
        package: "9.0 LPA",
        location: "Hyderabad",
        eligibility: "CGPA >= 7.5, any branch",
      },
    ],
    eligibilityCriteria: { minCgpa: 7.5, allowedBranches: ["CSE", "IT", "ECE", "EEE"], backlogAllowed: false },
    hiringProcess: ["Coding Round", "System Design", "Technical Interview", "HR Round"],
    active: true,
  },
  {
    name: "DataForge Analytics",
    website: "https://example.com/dataforge",
    industry: "Data & Analytics",
    headquarters: "Pune, India",
    description: "Analytics startup focused on BI dashboards and ML pipelines for retail.",
    roles: [
      {
        title: "Data Analyst",
        package: "7.2 LPA",
        location: "Pune / Remote",
        eligibility: "CGPA >= 6.5, any branch",
      },
    ],
    eligibilityCriteria: { minCgpa: 6.5, allowedBranches: ["CSE", "IT", "ECE", "MEC"], backlogAllowed: true },
    hiringProcess: ["Aptitude Test", "SQL Round", "Technical Interview", "HR Round"],
    active: true,
  },
  {
    name: "Quantum Labs",
    website: "https://example.com/quantumlabs",
    industry: "AI / ML Research",
    headquarters: "Bengaluru, India",
    description: "Applied AI lab building document intelligence and NLP products.",
    roles: [
      {
        title: "ML Engineer",
        package: "12.0 LPA",
        location: "Bengaluru",
        eligibility: "CGPA >= 8.0, CSE/IT",
      },
    ],
    eligibilityCriteria: { minCgpa: 8, allowedBranches: ["CSE", "IT"], backlogAllowed: false },
    hiringProcess: ["Coding Round", "ML Round", "Technical Interview", "HR Round"],
    active: true,
  },
  {
    name: "GreenEnergy Robotics",
    website: "https://example.com/greenrobotics",
    industry: "Robotics / Hardware",
    headquarters: "Chennai, India",
    description: "Robotics startup building autonomous solutions for solar farm maintenance.",
    roles: [
      {
        title: "Embedded Software Engineer",
        package: "6.8 LPA",
        location: "Chennai",
        eligibility: "CGPA >= 7.0, ECE/EEE/MEC",
      },
    ],
    eligibilityCriteria: { minCgpa: 7, allowedBranches: ["ECE", "EEE", "MEC"], backlogAllowed: true },
    hiringProcess: ["Technical Test", "Technical Interview", "HR Round"],
    active: false,
  },
];

async function upsertCompany(seed) {
  const existing = await Company.findOne({ name: seed.name });
  if (existing) {
    await Company.updateOne({ _id: existing._id }, { $set: seed });
    console.log(`[seed] Updated company: ${seed.name}`);
    return existing;
  }
  const created = await Company.create(seed);
  console.log(`[seed] Created company: ${seed.name}`);
  return created;
}

async function upsertExperience(seed) {
  const exists = await PlacementExperience.findOne({
    company: seed.company,
    studentName: seed.studentName,
  });
  if (exists) {
    await PlacementExperience.updateOne({ _id: exists._id }, { $set: seed });
    console.log(`[seed] Updated experience: ${seed.studentName} @ company ${seed.company}`);
    return;
  }
  await PlacementExperience.create(seed);
  console.log(`[seed] Created experience: ${seed.studentName} @ company ${seed.company}`);
}

async function run() {
  console.log("[seed] Starting seed process...");
  const conn = await connectDB();
  if (!conn) {
    console.error("[seed] Could not connect to MongoDB. Aborting seed.");
    process.exitCode = 1;
    return;
  }

  try {
    const createdCompanies = [];
    for (const seed of companies) {
      const company = await upsertCompany(seed);
      createdCompanies.push(company);
    }

    const [nova, cloud, dataforge, quantum] = createdCompanies;

    const experiences = [
      {
        company: nova._id,
        studentName: "Aarav Sharma",
        college: "Delhi Technological University",
        branch: "CSE",
        graduationYear: 2024,
        role: "Software Engineer",
        package: "8.5 LPA",
        rounds: [
          { name: "Aptitude Test", type: "aptitude", details: "30 questions in 40 minutes, quantitative + logical." },
          {
            name: "Coding Round",
            type: "coding",
            details: "2 DSA problems on arrays and strings.",
            questions: ["Find the first non-repeating character", "Merge overlapping intervals"],
          },
          {
            name: "Technical Interview",
            type: "technical",
            details: "Focused on OOP, DBMS, and a small system design discussion.",
            questions: ["Explain the four pillars of OOP", "Design a URL shortener"],
          },
          { name: "HR Round", type: "hr", details: "Behavioral questions and salary discussion." },
        ],
        outcome: "offered",
        tips: "Be thorough with DSA basics and practice explaining your projects clearly.",
      },
      {
        company: cloud._id,
        studentName: "Priya Iyer",
        college: "VIT Vellore",
        branch: "IT",
        graduationYear: 2024,
        role: "DevOps Engineer",
        package: "9.0 LPA",
        rounds: [
          { name: "Coding Round", type: "coding", details: "Scripting and shell questions." },
          {
            name: "System Design",
            type: "technical",
            details: "Designing a CI/CD pipeline for a microservices app.",
          },
          { name: "Technical Interview", type: "technical", details: "Docker, Kubernetes, and AWS basics." },
          { name: "HR Round", type: "hr" },
        ],
        outcome: "offered",
        tips: "Hands-on Docker and a basic Kubernetes project really helped me stand out.",
      },
      {
        company: dataforge._id,
        studentName: "Rohan Mehta",
        college: "COEP Pune",
        branch: "ECE",
        graduationYear: 2024,
        role: "Data Analyst",
        package: "7.2 LPA",
        rounds: [
          { name: "Aptitude Test", type: "aptitude" },
          { name: "SQL Round", type: "coding", questions: ["Write a query to find second highest salary"] },
          { name: "Technical Interview", type: "technical", details: "Python, pandas, and statistics." },
          { name: "HR Round", type: "hr" },
        ],
        outcome: "rejected",
        tips: "Practice SQL window functions and probability problems thoroughly.",
      },
      {
        company: quantum._id,
        studentName: "Sneha Reddy",
        college: "BITS Pilani",
        branch: "CSE",
        graduationYear: 2024,
        role: "ML Engineer",
        package: "12.0 LPA",
        rounds: [
          { name: "Coding Round", type: "coding", questions: ["Implement k-means from scratch"] },
          {
            name: "ML Round",
            type: "technical",
            details: "Questions on regression, regularization, and evaluation metrics.",
            questions: ["Difference between L1 and L2 regularization", "Explain precision vs recall"],
          },
          { name: "Technical Interview", type: "technical", details: "End-to-end ML pipeline discussion." },
          { name: "HR Round", type: "hr" },
        ],
        outcome: "offered",
        tips: "Be ready to explain every line of your ML projects and the math behind them.",
      },
    ];

    for (const exp of experiences) {
      await upsertExperience(exp);
    }

    const companyCount = await Company.countDocuments();
    const expCount = await PlacementExperience.countDocuments();
    console.log(`[seed] Done. Companies: ${companyCount}, Experiences: ${expCount}`);
  } catch (err) {
    console.error("[seed] Seeding failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("[seed] MongoDB connection closed.");
  }
}

run();
