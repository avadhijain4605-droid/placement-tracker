import mongoose from "mongoose";

const { Schema } = mongoose;

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ["applied", "shortlisted", "assessment", "interview", "selected", "rejected", "withdrawn"],
      required: true,
    },
    changedBy: { type: Schema.Types.ObjectId, ref: "Student" },
    note: { type: String, trim: true, default: "" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const applicationSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    drive: { type: Schema.Types.ObjectId, ref: "PlacementDrive", required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "assessment", "interview", "selected", "rejected", "withdrawn"],
      default: "applied",
    },
    statusHistory: [statusHistorySchema],
    appliedViaExternal: { type: Boolean, default: false },
    coverNote: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

applicationSchema.index({ student: 1, drive: 1 }, { unique: true });

applicationSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("PlacementApplication", applicationSchema);
