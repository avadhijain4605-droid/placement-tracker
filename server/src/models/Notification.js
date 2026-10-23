import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: "" },
    link: { type: String, trim: true, default: "" },
    read: { type: Boolean, default: false },
    announcement: { type: Schema.Types.ObjectId, ref: "Announcement", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

notificationSchema.index({ student: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
