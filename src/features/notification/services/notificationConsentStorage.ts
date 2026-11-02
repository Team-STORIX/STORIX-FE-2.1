import { getItem, setItem } from '../../../lib/storage/async'

// The async-storage helper auto-prefixes every key with "storix.", so the key
// passed here resolves to the full, explicit key:
//   user-scoped:        storix.notificationConsent.completed.{userId}
//   installation-scoped: storix.notificationConsent.completed
// User-scoped is preferred so a different account on the same device is asked
// once for itself; installation-scoped is the fallback when no userId is known.
const BASE_KEY = 'notificationConsent.completed'

const keyFor = (userId?: number | null): string =>
  userId != null ? `${BASE_KEY}.${userId}` : BASE_KEY

/** True once the user has responded (agree or reject) to the consent modal. */
export const isNotificationConsentCompleted = async (
  userId?: number | null,
): Promise<boolean> => {
  const value = await getItem<boolean>(keyFor(userId))
  return value === true
}

/** Records that the consent modal has been answered so it never shows again
 * for this user/installation (until storage is reset, e.g. reinstall). */
export const markNotificationConsentCompleted = async (
  userId?: number | null,
): Promise<void> => {
  await setItem(keyFor(userId), true)
}
