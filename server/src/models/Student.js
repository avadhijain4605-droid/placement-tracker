import mongoose from "mongoose";

const { Schema } = mongoose;

const codingProfileSchema = new Schema(
  {
    platform: {
      type: String,
      enum: ["leetcode", "hackerrank", "codechef", "codeforces", "github", "geeksforgeeks", "linkedin", "portfolio", "other"],
      default: "other",
    },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    technologies: [{ type: String, trim: true }],
    githubLink: { type: String, trim: true, default: "" },
    demoLink: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const certificationSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    issuer: { type: String, trim: true, default: "" },
    issueDate: { type: String, trim: true, default: "" },
    credentialId: { type: String, trim: true, default: "" },
    credentialUrl: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const internshipSchema = new Schema(
  {
    company: { type: String, trim: true, required: true },
    role: { type: String, trim: true, default: "" },
    startDate: { type: String, trim: true, default: "" },
    endDate: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const achievementSchema = new Schema(
  {
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    date: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const placementOfferSchema = new Schema(
  {
    company: { type: String, trim: true, required: true },
    role: { type: String, trim: true, default: "" },
    package: { type: String, trim: true, default: "" },
    offerDate: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["accepted", "rejected", "pending"], default: "pending" },
  },
  { _id: true }
);

const studentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },

    // ── Personal & Academic Details ──
    phone: { type: String, trim: true, default: "" },
    college: { type: String, trim: true, default: "" },
    degree: { type: String, trim: true, default: "" },
    branch: { type: String, trim: true, default: "" },
    graduationYear: { type: Number, min: 2000, max: 2100 },
    cgpa: { type: Number, min: 0, max: 10 },
    totalActiveBacklogs: { type: Number, min: 0, default: 0 },
    backlogHistory: { type: Number, min: 0, default: 0 },

    // ── Skills & Experience ──
    skills: [{ type: String, trim: true }],
    programmingLanguages: [{ type: String, trim: true }],
    frameworks: [{ type: String, trim: true }],
    projects: [projectSchema],
    internships: [internshipSchema],
    achievements: [achievementSchema],

    // ── Certifications ──
    certifications: [certificationSchema],

    // ── Resume ──
    resume: {
      filename: { type: String, default: "" },
      path: { type: String, default: "" },
      uploadedAt: { type: Date, default: null },
    },

    // ── Coding Profiles & Links ──
    codingProfiles: [codingProfileSchema],

    // ── Placement Preferences ──
    preferredRoles: [{ type: String, trim: true }],
    preferredLocations: [{ type: String, trim: true }],
    jobType: {
      type: String,
      enum: ["full-time", "internship", "both", ""],
      default: "",
    },

    // ── Placement Information ──
    placementStatus: {
      type: String,
      enum: ["not_placed", "placed", "in_process", ""],
      default: "not_placed",
    },
    offers: [placementOfferSchema],

    // ── Legacy / system fields ──
    role: {
      type: String,
      enum: ["student", "admin", "super_admin"],
      default: "student",
    },
    archived: { type: Boolean, default: false },

    // Kept for backward-compatibility with older code that reads `backlogs`.
    // Maps to totalActiveBacklogs. Updated whenever totalActiveBacklogs changes.
    backlogs: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

studentSchema.methods.toJSON = function toPublicJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export default mongoose.model("Student", studentSchema);
