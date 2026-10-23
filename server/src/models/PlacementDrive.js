import mongoose from "mongoose";

const { Schema } = mongoose;

const driveSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    jobTitle: { type: String, required: true, trim: true },
    jobDescription: { type: String, trim: true, default: "" },
    jobType: {
      type: String,
      enum: ["internship", "full-time", "other"],
      default: "full-time",
    },
    eligibility: {
      degrees: [{ type: String, trim: true }],
      branches: [{ type: String, trim: true }],
      graduationYear: [{ type: Number }],
      minCgpa: { type: Number, min: 0, max: 10, default: 0 },
      backlogAllowed: { type: Boolean, default: true },
      maxBacklogs: { type: Number, min: 0, default: 0 },
    },
    package: {
      minAmount: { type: Number, min: 0 },
      maxAmount: { type: Number, min: 0 },
      currency: { type: String, trim: true, default: "INR" },
      period: {
        type: String,
        enum: ["lpa", "monthly", "one-time", "stipend"],
        default: "lpa",
      },
    },
    jobLocation: { type: String, trim: true, default: "" },
    workMode: {
      type: String,
      enum: ["onsite", "remote", "hybrid"],
      default: "onsite",
    },
    applicationOpenDate: { type: Date },
    applicationDeadline: { type: Date, required: true },
    driveDate: { type: Date },
    selectionRounds: [
      {
        name: { type: String, trim: true },
        date: { type: Date },
        details: { type: String, trim: true, default: "" },
      },
    ],
    requiredSkills: [{ type: String, trim: true }],
    applicationInstructions: { type: String, trim: true, default: "" },
    externalApplicationUrl: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "published", "closed", "archived"],
      default: "draft",
      index: true,
    },
    resources: [
      {
        title: { type: String, trim: true },
        url: { type: String, trim: true },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "Student" },
  },
  { timestamps: true }
);

driveSchema.index({ company: 1, status: 1 });
driveSchema.index({ jobTitle: "text" });

driveSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("PlacementDrive", driveSchema);
