// Domain types for the push-notification feature.
// Kept narrow on purpose — this phase only covers permission + FCM token
// collection + backend registration. Inbound payloads and notification-centre
// types will be added in a later phase.

export type PushPlatform = 'ios' | 'android'

export type PushPermissionStatus =
  | 'authorized'
  | 'provisional'
  | 'denied'
  | 'not-determined'
  | 'blocked'
  | 'granted'

export type PushPermissionResult = {
  platform: PushPlatform
  granted: boolean
  status: PushPermissionStatus
}

// Payload accepted by POST /api/v1/notifications/device-tokens (placeholder
// path — see notification.api.ts for the real spec lookup). Platform values
// upper-cased because the BE side typically uses the JPA enum convention; the
// API client lowercases if the contract differs.
export type RegisterDeviceTokenPayload = {
  deviceToken: string
  platform: 'IOS' | 'ANDROID'
  appVersion?: string
  deviceType?: string
}
