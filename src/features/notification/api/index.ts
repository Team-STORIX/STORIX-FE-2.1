export {
  deletePushDevice,
  syncPushDevice,
  updatePushDeviceFcmToken,
} from './pushDevice.api'
export {
  getNotifications,
  getNotificationSettings,
  getNotificationBadgeCount,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  sendAdminTestDispatch,
  sendAdminTestPush,
  updateMarketingConsent,
  updateNotificationSettings,
} from './notification.api'

export { notificationKeys } from './notification.keys'

export type {
  AdminTestDispatchPayload,
  AdminTestPushPayload,
  BadgeCount,
  MarketingConsentResult,
  NotificationCategory,
  NotificationItem,
  NotificationPage,
  NotificationSettings,
  NotificationTargetType,
  NotificationType,
  UpdateNotificationSettingsPayload,
} from './notification.schema'

export type {
  OsPlatform,
  PushDeviceResponse,
  SyncPushDevicePayload,
  UpdateFcmTokenPayload,
} from './pushDevice.schema'
