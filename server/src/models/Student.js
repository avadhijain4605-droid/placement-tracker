import mongoose from "mongoose";

const { Schema } = mongoose;

const codingProfileSchema = new Schema(
  {
    platform: {
      type: String,
      enum: ["leetcode", "hackerrank", "codechef", "codeforces", "github", "other"],
      default: "other",
    },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const studentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    college: { type: String, trim: true, default: "" },
    graduationYear: { type: Number, min: 2000, max: 2100 },
    cgpa: { type: Number, min: 0, max: 10 },
    branch: { type: String, trim: true, default: "" },
    backlogs: { type: Number, min: 0, default: 0 },
    skills: [{ type: String, trim: true }],
    projects: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        link: { type: String, trim: true },
      },
    ],
    certifications: [
      {
        name: { type: String, trim: true },
        issuer: { type: String, trim: true },
        link: { type: String, trim: true },
      },
    ],
    codingProfiles: [codingProfileSchema],
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
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
