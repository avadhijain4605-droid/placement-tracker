import mongoose from "mongoose";

const { Schema } = mongoose;

const companySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    website: { type: String, trim: true, default: "" },
    industry: { type: String, trim: true, default: "" },
    headquarters: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    roles: [
      {
        title: { type: String, trim: true },
        package: { type: String, trim: true },
        location: { type: String, trim: true },
        eligibility: { type: String, trim: true },
      },
    ],
    eligibilityCriteria: {
      minCgpa: { type: Number, min: 0, max: 10 },
      allowedBranches: [{ type: String, trim: true }],
      backlogAllowed: { type: Boolean, default: false },
      graduationYear: [{ type: Number }],
    },
    requiredSkills: [{ type: String, trim: true }],
    hiringProcess: [{ type: String, trim: true }],
    oaPatterns: [
      {
        round: { type: String, trim: true },
        type: { type: String, trim: true, default: "coding" },
        duration: { type: String, trim: true },
        difficulty: {
          type: String,
          enum: ["easy", "medium", "hard"],
          default: "medium",
        },
        description: { type: String, trim: true },
        topics: [{ type: String, trim: true }],
      },
    ],
    interviewQuestions: [
      {
        question: { type: String, trim: true },
        type: {
          type: String,
          enum: ["technical", "behavioral", "coding", "hr", "other"],
          default: "technical",
        },
        difficulty: {
          type: String,
          enum: ["easy", "medium", "hard"],
          default: "medium",
        },
        round: { type: String, trim: true },
      },
    ],
    preparationResources: [
      {
        title: { type: String, trim: true },
        type: {
          type: String,
          enum: ["article", "video", "course", "book", "practice", "other"],
          default: "article",
        },
        url: { type: String, trim: true },
        topic: { type: String, trim: true },
        description: { type: String, trim: true },
      },
    ],
    applicationDeadline: { type: Date },
    logoUrl: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

companySchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Company", companySchema);
