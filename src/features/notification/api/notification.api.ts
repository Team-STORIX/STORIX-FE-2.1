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
 *  - Short-circuits with a synthetic success envelope so the bootstrap flow
 *    remains exercised. No network call is made in any build.
 */
export const registerDeviceToken = async (
  payload: RegisterDeviceTokenPayload,
): Promise<ApiResponse<null>> => {
  // TODO(PUSH-2-BE): remove this short-circuit once the endpoint is live.
  const ENDPOINT_AVAILABLE = false

  if (!ENDPOINT_AVAILABLE) {
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
