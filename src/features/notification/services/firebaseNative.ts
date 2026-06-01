type FirebaseAppModule = {
  getApps: () => unknown[]
}

type FirebaseMessagingModule = {
  AuthorizationStatus: {
    AUTHORIZED: number
    PROVISIONAL: number
    DENIED: number
    NOT_DETERMINED: number
  }
  getInitialNotification: (messaging: unknown) => Promise<{ data?: unknown } | null>
  getMessaging: () => unknown
  getToken: (messaging: unknown) => Promise<string>
  hasPermission: (messaging: unknown) => Promise<number>
  onMessage: (
    messaging: unknown,
    listener: (remoteMessage: { data?: unknown; notification?: { title?: string; body?: string } }) => void,
  ) => () => void
  onNotificationOpenedApp: (
    messaging: unknown,
    listener: (remoteMessage: { data?: unknown } | null) => void,
  ) => () => void
  onTokenRefresh: (messaging: unknown, listener: (token: string) => void) => () => void
  registerDeviceForRemoteMessages: (messaging: unknown) => Promise<void>
  requestPermission: (messaging: unknown) => Promise<number>
}

const loadFirebaseApp = (): FirebaseAppModule | null => {
  try {
    return require('@react-native-firebase/app') as FirebaseAppModule
  } catch {
    return null
  }
}

export const loadFirebaseMessaging = (): FirebaseMessagingModule | null => {
  try {
    return require('@react-native-firebase/messaging') as FirebaseMessagingModule
  } catch {
    return null
  }
}

export const getFirebaseMessagingIfAvailable = (): {
  messagingModule: FirebaseMessagingModule
  messaging: unknown
} | null => {
  try {
    const appModule = loadFirebaseApp()
    const messagingModule = loadFirebaseMessaging()
    if (!appModule || !messagingModule || appModule.getApps().length === 0) {
      return null
    }
    return {
      messagingModule,
      messaging: messagingModule.getMessaging(),
    }
  } catch {
    return null
  }
}

export const isFirebaseNativeAvailable = (): boolean =>
  getFirebaseMessagingIfAvailable() !== null
