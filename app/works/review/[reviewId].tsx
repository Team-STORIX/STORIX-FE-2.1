import { useLocalSearchParams } from 'expo-router'
import { ReviewDetailScreen } from '../../../src/features/works'

export default function WorksReviewDetailRoute() {
  const {
    reviewId: reviewIdParam,
    from,
    worksId: worksIdParam,
  } = useLocalSearchParams<{
    reviewId: string
    from?: string
    worksId?: string
  }>()
  const reviewId =
    typeof reviewIdParam === 'string' ? Number(reviewIdParam) : 0
  const sourceWorksId =
    typeof worksIdParam === 'string' ? Number(worksIdParam) : undefined

  return (
    <ReviewDetailScreen
      reviewId={Number.isFinite(reviewId) ? reviewId : 0}
      source={from === 'library' ? 'library' : undefined}
      sourceWorksId={
        sourceWorksId != null && Number.isFinite(sourceWorksId)
          ? sourceWorksId
          : undefined
      }
    />
  )
}
