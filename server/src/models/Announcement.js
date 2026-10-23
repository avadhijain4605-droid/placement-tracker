import mongoose from "mongoose";

const { Schema } = mongoose;

const announcementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["new-drive", "deadline", "assessment", "interview", "eligibility", "general"],
      default: "general",
    },
    drive: { type: Schema.Types.ObjectId, ref: "PlacementDrive", default: null },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "Student" },
  },
  { timestamps: true }
);

announcementSchema.index({ published: 1, publishedAt: -1 });

announcementSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Announcement", announcementSchema);
