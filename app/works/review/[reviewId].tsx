import { useLocalSearchParams } from 'expo-router'
import { ReviewDetailScreen } from '../../../src/features/works'

export default function WorksReviewDetailRoute() {
  const { reviewId: reviewIdParam } = useLocalSearchParams<{
    reviewId: string
  }>()
  const reviewId =
    typeof reviewIdParam === 'string' ? Number(reviewIdParam) : 0

  return <ReviewDetailScreen reviewId={Number.isFinite(reviewId) ? reviewId : 0} />
}
