import AsyncStorage from '@react-native-async-storage/async-storage'

// All keys written by this module are prefixed so they can be bulk-cleared
// without touching system or third-party keys.
const PREFIX = 'storix.'

/**
 * Read a JSON-serialised value from AsyncStorage.
 * Returns null if the key is absent or the stored value is unparseable.
 */
export const getItem = async <T>(key: string): Promise<T | null> => {
  const raw = await AsyncStorage.getItem(PREFIX + key)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * Write a JSON-serialised value to AsyncStorage.
 */
export const setItem = async <T>(key: string, value: T): Promise<void> => {
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value))
}

/**
 * Remove a single key from AsyncStorage.
 */
export const removeItem = async (key: string): Promise<void> => {
  await AsyncStorage.removeItem(PREFIX + key)
}

/**
 * Remove every key that belongs to this app (prefix = "storix.").
 * Use on full logout or factory-reset flow.
 */
export const clearAllItems = async (): Promise<void> => {
  const allKeys = await AsyncStorage.getAllKeys()
  const ours = allKeys.filter((k) => k.startsWith(PREFIX))
  if (ours.length > 0) await AsyncStorage.multiRemove(ours)
}
