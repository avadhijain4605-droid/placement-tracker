import mongoose from "mongoose";

const { Schema } = mongoose;

const prepTaskSchema = new Schema(
  {
    skill: { type: String, required: true, trim: true },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    reason: { type: String, default: "" },
    done: { type: Boolean, default: false },
  },
  { _id: true }
);

const prepProgressSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    title: { type: String, trim: true, default: "" },
    matched: [{ type: String, trim: true }],
    missing: [{ type: String, trim: true }],
    eligibility: [
      {
        criterion: { type: String },
        passed: { type: Boolean },
        label: { type: String },
        detail: { type: String },
      },
    ],
    eligibilityPassed: { type: Boolean, default: false },
    readiness: { type: Number, min: 0, max: 100, default: null },
    readinessFormula: { type: String, default: "" },
    tasks: [prepTaskSchema],
    saved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

prepProgressSchema.index({ studentId: 1, companyId: 1 }, { unique: true });

export default mongoose.model("PrepProgress", prepProgressSchema);
