import mongoose from "mongoose";

const { Schema } = mongoose;

const placementExperienceSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    studentName: { type: String, required: true, trim: true },
    college: { type: String, trim: true, default: "" },
    branch: { type: String, trim: true, default: "" },
    graduationYear: { type: Number, min: 2000, max: 2100 },
    role: { type: String, required: true, trim: true },
    package: { type: String, trim: true, default: "" },
    rounds: [
      {
        name: { type: String, trim: true },
        type: {
          type: String,
          enum: ["aptitude", "coding", "technical", "hr", "group-discussion", "other"],
          default: "other",
        },
        details: { type: String, trim: true },
        questions: [{ type: String, trim: true }],
      },
    ],
    outcome: {
      type: String,
      enum: ["offered", "rejected", "in-progress", "withdrawn"],
      default: "in-progress",
    },
    tips: { type: String, trim: true, default: "" },
    postedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

placementExperienceSchema.index({ company: 1, studentName: 1 }, { unique: true });

placementExperienceSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("PlacementExperience", placementExperienceSchema);
