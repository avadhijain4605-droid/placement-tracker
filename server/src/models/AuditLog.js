import mongoose from "mongoose";

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    actorName: { type: String, trim: true, default: "" },
    actorRole: { type: String, enum: ["student", "admin", "super_admin"], default: "student" },
    action: { type: String, required: true, trim: true },
    resource: { type: String, trim: true, default: "" },
    resourceId: { type: Schema.Types.ObjectId, default: null },
    details: { type: String, trim: true, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
