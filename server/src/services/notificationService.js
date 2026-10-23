import Notification from '../models/Notification.js';

export const createNotification = async ({
  recipientId,
  title,
  message,
  type = 'system',
  relatedReportId = null
}) => {
  try {
    const notification = await Notification.create({
      recipientId,
      title,
      message,
      type,
      relatedReportId,
      isRead: false
    });
    return notification;
  } catch (error) {
    console.error('[Notification Error]: Failed to create notification:', error.message);
    return null;
  }
};

export const notifySupervisors = async (serviceArea, title, message, relatedReportId = null) => {
  try {
    const User = (await import('../models/User.js')).default;
    const supervisors = await User.find({
      role: 'supervisor',
      active: true,
      serviceArea: serviceArea
    });

    const notifications = await Promise.all(
      supervisors.map((sup) =>
        createNotification({
          recipientId: sup._id,
          title,
          message,
          type: 'unassigned_alert',
          relatedReportId
        })
      )
    );
    return notifications;
  } catch (error) {
    console.error('[Supervisor Notification Error]:', error.message);
    return [];
  }
};
