import AuditLog from "../models/AuditLog.js";

export async function logAction({ actor, actorName, actorRole, action, resource, resourceId, details }) {
  try {
    await AuditLog.create({
      actor,
      actorName: actorName || "",
      actorRole: actorRole || "student",
      action,
      resource: resource || "",
      resourceId: resourceId || null,
      details: details || "",
    });
  } catch {
    // Logging failures must not break the main operation
  }
}
