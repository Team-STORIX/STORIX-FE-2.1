import { QueryClient } from '@tanstack/react-query'

import { isAdultVerificationRequiredError } from '../api/adultVerificationRequired'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1_000,
      // The adult verification 403 does not change on retry; failing fast
      // lets detail screens step back right away.
      retry: (failureCount, error) =>
        !isAdultVerificationRequiredError(error) && failureCount < 1,
    },
  },
})
