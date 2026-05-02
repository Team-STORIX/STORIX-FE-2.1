import { useMutation } from '@tanstack/react-query'
import { postReaderReview } from '../../lib/api/plus/plus.api'
import type { ReaderReviewCreateRequest } from '../../lib/api/plus/plus.schema'

export function useCreateReaderReview() {
  return useMutation({
    mutationFn: (payload: ReaderReviewCreateRequest) => postReaderReview(payload),
  })
}
