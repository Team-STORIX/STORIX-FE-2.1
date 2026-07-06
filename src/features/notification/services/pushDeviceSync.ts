import {
  deletePushDevice,
  syncPushDevice,
  updatePushDeviceFcmToken,
} from '../api/pushDevice.api'
import { getItem, removeItem, setItem } from '../../../lib/storage/async'
import { getOrCreateInstallationId } from './deviceInstallation'
import { getDeviceMeta, type DeviceMeta } from './deviceMeta'
import { getFcmDeviceToken } from './fcmToken'
import { getPushPermissionStatus, requestPushPermission } from './pushPermission'

// In-memory snapshot of the last values pushed to the backend this session.
// Purely a dedup guard so foreground re-checks and re-renders don't fire
// redundant network calls. A full reconcile on the next app-active/auth event
// is always acceptable, so persistence across restarts is not required.
type SyncCache = {
  installationId: string | null
  lastFcmToken: string | null
  lastPermissionGranted: boolean | null
  lastAppVersion: string | null
  lastOsVersion: string | null
  lastDeviceModel: string | null
  lastSyncedAt: number | null
}

const cache: SyncCache = {
  installationId: null,
  lastFcmToken: null,
  lastPermissionGranted: null,
  lastAppVersion: null,
  lastOsVersion: null,
  lastDeviceModel: null,
  lastSyncedAt: null,
}

type PersistedSyncState = {
  installationId: string
  lastPermissionGranted: boolean
  lastSyncedAt: number | null
}

const SYNC_STATE_KEY = 'pushDeviceSyncState'

// Guards against overlapping runs (e.g. auth + AppState firing together).
let inFlight: Promise<void> | null = null

type ReconcilePushDeviceOptions = {
  requestPermission?: boolean
}

// Sanitised dev-only warning. Never logs token material.
const warn = (msg: string, err: unknown): void => {
  if (__DEV__) {
    const detail = err instanceof Error ? err.message : String(err)
    // eslint-disable-next-line no-console
    console.warn('[push-device] sync failed', msg, detail)
  }
}

// [NOTIFICATION_TEST_DEBUG] temporary push-device sync tracing — remove after QA.
// Never logs the full installationId or FCM token, only safe previews/booleans.
const debugSyncRequest = (
  installationId: string,
  fcmToken: string,
  meta: DeviceMeta,
): void => {
  if (!__DEV__) return
  // eslint-disable-next-line no-console
  console.log('[NOTIFICATION_TEST_DEBUG] push-device sync request', {
    installationIdPreview: installationId.slice(0, 8),
    hasFcmToken: fcmToken.length > 0,
    osPlatform: meta.osPlatform,
    appVersion: meta.appVersion,
    osVersion: meta.osVersion,
    deviceModel: meta.deviceModel,
  })
}

const debugSyncFailure = (err: unknown): void => {
  if (!__DEV__) return
  const e = err as {
    response?: { status?: number; data?: { code?: string; message?: string } }
    message?: string
  }
  // eslint-disable-next-line no-console
  console.log('[NOTIFICATION_TEST_DEBUG] push-device sync failed', {
    status: e?.response?.status,
    code: e?.response?.data?.code,
    message: e?.response?.data?.message ?? e?.message,
  })
}

const metaChanged = (meta: DeviceMeta): boolean =>
  cache.lastAppVersion !== meta.appVersion ||
  cache.lastOsVersion !== meta.osVersion ||
  cache.lastDeviceModel !== meta.deviceModel

const writeCache = (
  installationId: string,
  fcmToken: string,
  meta: DeviceMeta,
): void => {
  cache.installationId = installationId
  cache.lastFcmToken = fcmToken
  cache.lastPermissionGranted = true
  cache.lastAppVersion = meta.appVersion
  cache.lastOsVersion = meta.osVersion
  cache.lastDeviceModel = meta.deviceModel
  cache.lastSyncedAt = Date.now()
  void persistSyncState()
}

const persistSyncState = async (): Promise<void> => {
  if (!cache.installationId || cache.lastPermissionGranted == null) return
  try {
    await setItem<PersistedSyncState>(SYNC_STATE_KEY, {
      installationId: cache.installationId,
      lastPermissionGranted: cache.lastPermissionGranted,
      lastSyncedAt: cache.lastSyncedAt,
    })
  } catch (err) {
    warn('persist state', err)
  }
}

const hydrateSyncState = async (installationId: string): Promise<void> => {
  if (cache.lastPermissionGranted != null || cache.lastSyncedAt != null) return
  try {
    const persisted = await getItem<PersistedSyncState>(SYNC_STATE_KEY)
    if (!persisted || persisted.installationId !== installationId) return
    cache.lastPermissionGranted = persisted.lastPermissionGranted
    cache.lastSyncedAt = persisted.lastSyncedAt
  } catch (err) {
    warn('hydrate state', err)
  }
}

const doFullSync = async (
  installationId: string,
  fcmToken: string,
  meta: DeviceMeta,
): Promise<void> => {
  debugSyncRequest(installationId, fcmToken, meta)
  try {
    await syncPushDevice({
      installationId,
      fcmToken,
      osPlatform: meta.osPlatform,
      appVersion: meta.appVersion,
      osVersion: meta.osVersion,
      deviceModel: meta.deviceModel,
    })
  } catch (err) {
    debugSyncFailure(err)
    throw err
  }
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[NOTIFICATION_TEST_DEBUG] push-device sync success')
  }
  writeCache(installationId, fcmToken, meta)
}

/**
 * Reconciles this device's push state with the backend. Safe to call on auth
 * bootstrap and on every app-foreground transition — it self-dedups via the
 * in-memory cache. Never throws.
 *
 * By default this reads the current OS permission without prompting. Pass
 * requestPermission=true only from explicit opt-in UI.
 *
 * Decision table (permission granted):
 *  - never synced / OFF→ON / device-meta changed → full POST /sync
 *  - already synced, only FCM token changed       → PATCH /fcm-token
 *  - nothing changed                              → no-op
 * Permission ON→OFF (and we'd synced before)      → DELETE /{installationId}
 */
export const reconcilePushDevice = async (
  options: ReconcilePushDeviceOptions = {},
): Promise<void> => {
  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      const installationId = await getOrCreateInstallationId()
      cache.installationId = installationId
      await hydrateSyncState(installationId)

      const permission = options.requestPermission
        ? await requestPushPermission()
        : await getPushPermissionStatus()

      if (!permission.granted) {
        // ON→OFF: deactivate on the backend only if we had previously synced
        // as granted. Never synced → no-op (nothing to deactivate).
        if (cache.lastPermissionGranted === true) {
          try {
            await deletePushDevice(installationId)
          } catch (err) {
            warn('delete', err)
            return
          }
        }
        cache.lastPermissionGranted = false
        cache.lastFcmToken = null
        await persistSyncState()
        return
      }

      const token = await getFcmDeviceToken()
      if (!token) {
        // Granted but no token yet (APNs not ready / simulator). Retry next time.
        return
      }
      const meta = getDeviceMeta()

      const wasGranted = cache.lastPermissionGranted === true
      const neverSynced = cache.lastSyncedAt == null

      // First sync, OFF→ON, or device-meta change → full sync.
      if (neverSynced || !wasGranted || metaChanged(meta)) {
        await doFullSync(installationId, token, meta)
        return
      }

      // Already synced and granted; only the token differs → patch it.
      if (cache.lastFcmToken !== token) {
        try {
          await updatePushDeviceFcmToken({ installationId, fcmToken: token })
          cache.lastFcmToken = token
          cache.lastSyncedAt = Date.now()
          await persistSyncState()
        } catch (err) {
          // PATCH failed (e.g. backend lost the device row) → full sync.
          warn('token update, falling back to full sync', err)
          await doFullSync(installationId, token, meta)
        }
      }
      // else: nothing changed — no-op.
    } catch (err) {
      warn('reconcile', err)
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

/**
 * Handles an FCM onTokenRefresh event. Patches the token when a sync already
 * exists, otherwise falls back to a full reconcile (a PATCH would 4xx without a
 * prior /sync). Never throws.
 */
export const handleFcmTokenRefresh = async (
  newToken: string,
): Promise<void> => {
  if (!newToken || cache.lastFcmToken === newToken) return
  try {
    // No prior sync, or permission not known-granted → full reconcile path.
    if (cache.lastSyncedAt == null || cache.lastPermissionGranted !== true) {
      await reconcilePushDevice()
      return
    }

    const installationId =
      cache.installationId ?? (await getOrCreateInstallationId())
    cache.installationId = installationId

    try {
      await updatePushDeviceFcmToken({ installationId, fcmToken: newToken })
      cache.lastFcmToken = newToken
      cache.lastSyncedAt = Date.now()
      await persistSyncState()
    } catch (err) {
      warn('token refresh, falling back to full sync', err)
      await doFullSync(installationId, newToken, getDeviceMeta())
    }
  } catch (err) {
    warn('token refresh', err)
  }
}

/** Clears the in-memory sync cache (e.g. on logout) so the next authenticated
 * session performs a fresh full sync. */
export const resetPushDeviceSyncCache = (): void => {
  cache.installationId = null
  cache.lastFcmToken = null
  cache.lastPermissionGranted = null
  cache.lastAppVersion = null
  cache.lastOsVersion = null
  cache.lastDeviceModel = null
  cache.lastSyncedAt = null
  void removeItem(SYNC_STATE_KEY).catch((err) => warn('reset state', err))
}
