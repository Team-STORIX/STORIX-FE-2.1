import { apiClient } from '../../../lib/api/axios-instance'
import type { ApiResponse } from '../../../lib/api/types'
import type { RegisterDeviceTokenPayload } from '../types'

// TODO(PUSH-2-BE): replace once the backend exposes the real endpoint.
// The path below is the agreed-upon convention used elsewhere in the API
// surface (`/api/v1/<domain>/<resource>`); confirm with the BE spec and
// adjust before enabling real registration.
const REGISTER_DEVICE_TOKEN_PATH = '/api/v1/notifications/device-tokens'

/**
 * Registers a device FCM token with the backend so server-initiated pushes
 * can be routed to this device. Returns the API envelope as-is — the caller
 * decides what to do with the (likely empty) result.
 *
 * Behaviour while the BE endpoint is not yet implemented:
 *  - `__DEV__`: prints the token + payload and short-circuits with a
 *    synthetic success envelope so the bootstrap flow remains exercised.
 *  - production: also short-circuits (no network call) — we must not call
 *    a fake endpoint in shipping binaries.
 */
export const registerDeviceToken = async (
  payload: RegisterDeviceTokenPayload,
): Promise<ApiResponse<null>> => {
  // TODO(PUSH-2-BE): remove this short-circuit once the endpoint is live.
  const ENDPOINT_AVAILABLE = false

  // TODO(PUSH_DIAG): remove [PUSH_DIAG] logs after delivery is confirmed.
  const tokenPreview = `${payload.deviceToken.slice(0, 12)}…(len=${payload.deviceToken.length})`
  // eslint-disable-next-line no-console
  console.log('[PUSH_DIAG] registerDeviceToken called', {
    platform: payload.platform,
    tokenPreview,
    endpointAvailable: ENDPOINT_AVAILABLE,
  })

  if (!ENDPOINT_AVAILABLE) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(
        '[push] (dev) would register device token →',
        REGISTER_DEVICE_TOKEN_PATH,
        {
          ...payload,
          deviceToken: payload.deviceToken.slice(0, 12) + '…',
        },
      )
      // eslint-disable-next-line no-console
      console.log('[push] (dev) FCM token (full):', payload.deviceToken)
      // eslint-disable-next-line no-console
      console.log(
        '[PUSH_DIAG] FCM_REGISTRATION_TOKEN_FULL (from registerDeviceToken)',
        payload.deviceToken,
      )
    }
    return {
      isSuccess: true,
      code: 'PUSH_DEV_NOOP',
      message: 'Device token registration is a dev no-op until the backend endpoint exists.',
      result: null,
      timestamp: new Date().toISOString(),
    }
  }

  const res = await apiClient.post(REGISTER_DEVICE_TOKEN_PATH, payload)
  return res.data as ApiResponse<null>
}
