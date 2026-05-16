import { useMutation } from '@tanstack/react-query'

import { registerDeviceToken } from '../api/notification.api'
import type { RegisterDeviceTokenPayload } from '../types'

/**
 * Wraps the device-token registration call in a React Query mutation so
 * callers benefit from the standard `isPending` / `error` plumbing.
 *
 * Deliberately no query invalidation — there is no client cache for
 * registered tokens, and a successful registration has no observable UI
 * effect this phase.
 */
export const useRegisterDeviceToken = () =>
  useMutation({
    mutationKey: ['notification', 'registerDeviceToken'],
    mutationFn: (payload: RegisterDeviceTokenPayload) =>
      registerDeviceToken(payload),
  })
