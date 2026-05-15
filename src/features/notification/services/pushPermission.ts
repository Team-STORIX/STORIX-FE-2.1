import { PermissionsAndroid, Platform } from 'react-native'
import {
  AuthorizationStatus,
  getMessaging,
  requestPermission,
} from '@react-native-firebase/messaging'

import type {
  PushPermissionResult,
  PushPermissionStatus,
} from '../types'

// iOS authorization-status → our internal status string.
const mapIosStatus = (status: number): PushPermissionStatus => {
  switch (status) {
    case AuthorizationStatus.AUTHORIZED:
      return 'authorized'
    case AuthorizationStatus.PROVISIONAL:
      return 'provisional'
    case AuthorizationStatus.DENIED:
      return 'denied'
    case AuthorizationStatus.NOT_DETERMINED:
    default:
      return 'not-determined'
  }
}

// AUTHORIZED and PROVISIONAL both deliver remote pushes (provisional shows
// quietly in Notification Centre without alerting). Both are "granted" for
// our purposes — the backend still receives the token and can deliver.
const isIosGranted = (status: number): boolean =>
  status === AuthorizationStatus.AUTHORIZED ||
  status === AuthorizationStatus.PROVISIONAL

/**
 * Requests (or reads, if already prompted) the OS push-notification permission
 * and returns a platform-normalised result. Never throws — failures map to a
 * denied result so callers can show a "retry from settings" UI later.
 */
export const requestPushPermission = async (): Promise<PushPermissionResult> => {
  // TODO(PUSH_DIAG): remove [PUSH_DIAG] logs after delivery is confirmed.
  // eslint-disable-next-line no-console
  console.log('[PUSH_DIAG] requestPushPermission start', {
    os: Platform.OS,
    version: Platform.Version,
  })

  if (Platform.OS === 'ios') {
    try {
      const status = await requestPermission(getMessaging())
      // eslint-disable-next-line no-console
      console.log('[PUSH_DIAG] ios raw authorization status', status)
      const result: PushPermissionResult = {
        platform: 'ios',
        granted: isIosGranted(status),
        status: mapIosStatus(status),
      }
      // eslint-disable-next-line no-console
      console.log('[PUSH_DIAG] permission result', result)
      return result
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('[PUSH_DIAG] ios requestPermission threw', err)
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[push] iOS requestPermission failed', err)
      }
      return { platform: 'ios', granted: false, status: 'denied' }
    }
  }

  if (Platform.OS === 'android') {
    // Below API 33 there is no runtime permission for notifications — apps
    // can post freely. Treat as granted so the bootstrap flow proceeds.
    if (typeof Platform.Version === 'number' && Platform.Version < 33) {
      const result: PushPermissionResult = {
        platform: 'android',
        granted: true,
        status: 'granted',
      }
      // eslint-disable-next-line no-console
      console.log('[PUSH_DIAG] android <33, auto-granted', result)
      return result
    }

    try {
      const raw = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      )
      // eslint-disable-next-line no-console
      console.log('[PUSH_DIAG] android raw permission result', raw)

      let result: PushPermissionResult
      if (raw === PermissionsAndroid.RESULTS.GRANTED) {
        result = { platform: 'android', granted: true, status: 'granted' }
      } else if (raw === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        result = { platform: 'android', granted: false, status: 'blocked' }
      } else {
        result = { platform: 'android', granted: false, status: 'denied' }
      }
      // eslint-disable-next-line no-console
      console.log('[PUSH_DIAG] permission result', result)
      return result
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('[PUSH_DIAG] android requestPermission threw', err)
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[push] Android requestPermission failed', err)
      }
      return { platform: 'android', granted: false, status: 'denied' }
    }
  }

  // Web / other platforms: not supported in this phase. Report as iOS for
  // payload purposes since the bootstrap caller only uses `granted`.
  // eslint-disable-next-line no-console
  console.log('[PUSH_DIAG] unsupported platform for push', Platform.OS)
  return { platform: 'ios', granted: false, status: 'denied' }
}
