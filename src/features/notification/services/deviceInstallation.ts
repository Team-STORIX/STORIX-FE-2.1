import * as SecureStore from 'expo-secure-store'

// Per-installation identifier. Persists across app restarts; resets after a
// reinstall (SecureStore is wiped on uninstall), which is acceptable — the
// backend treats a new installationId as a new device row.
const INSTALLATION_ID_KEY = 'storix.push.installationId'

// In-memory mirror so repeated calls within a session avoid SecureStore reads.
let cachedId: string | null = null

const generateId = (): string => {
  const cryptoRef = (globalThis as { crypto?: { randomUUID?: () => string } })
    .crypto
  if (cryptoRef && typeof cryptoRef.randomUUID === 'function') {
    try {
      return cryptoRef.randomUUID()
    } catch {
      // Fall through to the timestamp/random fallback below.
    }
  }
  const rand = `${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`
  return `inst-${Date.now().toString(36)}-${rand}`
}

/**
 * Returns a stable per-installation ID, creating and persisting one on first
 * call. Never throws — if SecureStore is unavailable a session-scoped ID is
 * returned so callers can still proceed.
 */
export const getOrCreateInstallationId = async (): Promise<string> => {
  if (cachedId) return cachedId

  try {
    const existing = await SecureStore.getItemAsync(INSTALLATION_ID_KEY)
    if (existing && existing.length > 0) {
      cachedId = existing
      return existing
    }
  } catch {
    // Read failed — fall through and mint a fresh ID.
  }

  const id = generateId()
  try {
    await SecureStore.setItemAsync(INSTALLATION_ID_KEY, id)
  } catch {
    // Persist failed — keep the in-memory value for this session.
  }
  cachedId = id
  return id
}
