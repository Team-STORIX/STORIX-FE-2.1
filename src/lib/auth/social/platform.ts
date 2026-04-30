// src/lib/auth/social/platform.ts
// React Native replacement for the Capacitor-based platform.ts from 2.0.
import { Platform } from 'react-native'

export const isNativePlatform = (): boolean => Platform.OS !== 'web'

export const getPlatform = (): 'ios' | 'android' | 'web' => {
  const os = Platform.OS
  if (os === 'ios' || os === 'android') return os
  return 'web'
}
