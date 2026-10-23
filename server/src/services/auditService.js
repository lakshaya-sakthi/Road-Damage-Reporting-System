import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({
  action,
  entityType,
  entityId,
  user,
  details = {},
  req = null
}) => {
  try {
    const ipAddress = req
      ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1'
      : 'system';

    await AuditLog.create({
      action,
      entityType,
      entityId: String(entityId),
      performedBy: user?._id || null,
      performedByName: user?.name || 'System Auto-Engine',
      performedByRole: user?.role || 'system',
      details,
      ipAddress
    });
  } catch (error) {
    console.error('[Audit Log Error]: Failed to persist audit record:', error.message);
  }
};
