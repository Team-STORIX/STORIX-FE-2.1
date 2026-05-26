import { PermissionsAndroid, Platform } from 'react-native'
import {
  AuthorizationStatus,
  getMessaging,
  hasPermission,
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
  if (Platform.OS === 'ios') {
    try {
      const status = await requestPermission(getMessaging())
      return {
        platform: 'ios',
        granted: isIosGranted(status),
        status: mapIosStatus(status),
      }
    } catch (err) {
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
      return {
        platform: 'android',
        granted: true,
        status: 'granted',
      }
    }

    try {
      const raw = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      )

      if (raw === PermissionsAndroid.RESULTS.GRANTED) {
        return { platform: 'android', granted: true, status: 'granted' }
      }
      if (raw === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return { platform: 'android', granted: false, status: 'blocked' }
      }
      return { platform: 'android', granted: false, status: 'denied' }
    } catch (err) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[push] Android requestPermission failed', err)
      }
      return { platform: 'android', granted: false, status: 'denied' }
    }
  }

  // Web / other platforms: not supported in this phase. Report as iOS for
  // payload purposes since the bootstrap caller only uses `granted`.
  return { platform: 'ios', granted: false, status: 'denied' }
}

/**
 * Reads the CURRENT push-permission status without ever prompting the user.
 * Use this for passive UI (e.g. the "알림 수신" row) — entering a screen must
 * not trigger the OS permission dialog. Never throws; failures map to denied.
 */
export const getPushPermissionStatus =
  async (): Promise<PushPermissionResult> => {
    if (Platform.OS === 'ios') {
      try {
        // hasPermission() reads the stored authorization status; it does not
        // present the system prompt (requestPermission does that).
        const status = await hasPermission(getMessaging())
        return {
          platform: 'ios',
          granted: isIosGranted(status),
          status: mapIosStatus(status),
        }
      } catch (err) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[push] iOS hasPermission failed', err)
        }
        return { platform: 'ios', granted: false, status: 'denied' }
      }
    }

    if (Platform.OS === 'android') {
      // Below API 33 notifications need no runtime permission → always granted.
      if (typeof Platform.Version === 'number' && Platform.Version < 33) {
        return { platform: 'android', granted: true, status: 'granted' }
      }
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        )
        return {
          platform: 'android',
          granted,
          status: granted ? 'granted' : 'denied',
        }
      } catch (err) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[push] Android permission check failed', err)
        }
        return { platform: 'android', granted: false, status: 'denied' }
      }
    }

    return { platform: 'ios', granted: false, status: 'denied' }
  }
