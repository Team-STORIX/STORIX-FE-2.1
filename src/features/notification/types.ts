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
