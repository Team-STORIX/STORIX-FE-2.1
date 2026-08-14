import AsyncStorage from '@react-native-async-storage/async-storage'

const PENDING_NOTIFICATION_OPEN_KEY = 'storix.push.pendingNotificationOpen'

export async function savePendingNotificationOpenData(
  data: unknown,
): Promise<void> {
  if (data == null || typeof data !== 'object') return
  await AsyncStorage.setItem(
    PENDING_NOTIFICATION_OPEN_KEY,
    JSON.stringify(data),
  )
}

export async function consumePendingNotificationOpenData(): Promise<
  Record<string, unknown> | null
> {
  const raw = await AsyncStorage.getItem(PENDING_NOTIFICATION_OPEN_KEY)
  if (!raw) return null

  await AsyncStorage.removeItem(PENDING_NOTIFICATION_OPEN_KEY)
  try {
    const parsed = JSON.parse(raw)
    return parsed != null && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}
