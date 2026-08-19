import AuditLog from "../models/AuditLog.js";
import SystemLog from "../models/SystemLog.js";
import { logger } from "./logger.js";

export const writeAuditLog = async (req, { action, entityType, entityId, metadata } = {}) => {
  try {
    await AuditLog.create({
      tenantId: req.user?.tenantId,
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action,
      entityType,
      entityId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      requestId: req.requestId,
      metadata,
    });
  } catch (error) {
    logger.warn("Failed to write audit log", { error: error.message, requestId: req.requestId });
  }
};

export const writeSystemLog = async ({ level = "info", source, message, requestId, metadata }) => {
  try {
    await SystemLog.create({ level, source, message, requestId, metadata });
  } catch (error) {
    logger.warn("Failed to write system log", { error: error.message, requestId });
  }
};
