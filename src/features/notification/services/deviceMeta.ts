import Constants from 'expo-constants'
import { Platform } from 'react-native'

import type { OsPlatform } from '../api/pushDevice.schema'

export type DeviceMeta = {
  osPlatform: OsPlatform
  appVersion: string
  osVersion: string
  deviceModel: string
}

/**
 * Collects device metadata for the push-device sync payload using only
 * already-installed dependencies (expo-constants + react-native Platform).
 *
 * deviceModel uses a Platform-derived fallback because expo-device is not a
 * project dependency; this phase does not add new native packages.
 */
export const getDeviceMeta = (): DeviceMeta => {
  const osPlatform: OsPlatform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID'

  const appVersion =
    Constants.expoConfig?.version ??
    // nativeAppVersion is populated in built binaries; typed loosely as it is
    // absent from the public Constants type in some SDK versions.
    (Constants as { nativeAppVersion?: string | null }).nativeAppVersion ??
    'unknown'

  const osVersion = String(Platform.Version)

  const deviceModel = `${Platform.OS}-${Platform.Version}`

  return { osPlatform, appVersion, osVersion, deviceModel }
}
