import { useQuery } from '@tanstack/react-query'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { checkAppVersion } from '../api/appVersion.api'
import type {
  AppVersionCheckParams,
  AppVersionPlatform,
} from '../api/appVersion.schema'

export const appVersionKeys = {
  all: ['app-version'] as const,
  check: (params: AppVersionCheckParams) =>
    [...appVersionKeys.all, 'check', params.platform, params.version] as const,
}

export function useAppVersionCheck(
  params: AppVersionCheckParams,
  enabled = true,
) {
  return useQuery({
    queryKey: appVersionKeys.check(params),
    enabled: enabled && !!params.version,
    queryFn: () => checkAppVersion(params),
  })
}

export function getCurrentAppVersion(): string {
  return (
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    '0.0.0'
  )
}

export function getCurrentAppVersionPlatform(): AppVersionPlatform | null {
  if (Platform.OS === 'ios') return 'IOS'
  if (Platform.OS === 'android') return 'ANDROID'
  return null
}

export function useCurrentAppVersionCheck(enabled = true) {
  const platform = getCurrentAppVersionPlatform()
  const version = getCurrentAppVersion()

  return useAppVersionCheck(
    {
      platform: platform ?? 'IOS',
      version,
    },
    enabled && platform != null,
  )
}
