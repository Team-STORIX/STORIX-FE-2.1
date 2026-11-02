import type { RatingCountsMap } from '../types/profile-content.types'

const RATING_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const

/** Normalize API rating keys once for both the chart and the profile card. */
export function getProfileRatingStats(raw?: RatingCountsMap | null) {
  const parsed: Record<number, number> = {}

  for (const [key, value] of Object.entries(raw ?? {})) {
    const normalized = key.trim().replace(/_/g, '.')
    const match = normalized.match(/(\d+(\.\d+)?)/g)
    const numericKey = match ? match[match.length - 1] : normalized
    const rating = Number.parseFloat(numericKey)

    if (!Number.isNaN(rating)) {
      parsed[rating] =
        (parsed[rating] ?? 0) + (Number.isFinite(value) ? Number(value) : 0)
    }
  }

  const ratingData = RATING_STEPS.map((rating) => ({
    rating,
    count: parsed[rating] ?? 0,
    key: String(rating),
  }))
  const totalReviews = ratingData.reduce((sum, item) => sum + item.count, 0)
  const weightedSum = ratingData.reduce(
    (sum, item) => sum + item.rating * item.count,
    0,
  )
  const max = Math.max(...ratingData.map((item) => item.count))
  const maxCount = Number.isFinite(max) ? max : 0
  const mostGivenRating =
    totalReviews === 0 || maxCount <= 0
      ? 0
      : Math.max(
          ...ratingData.filter((item) => item.count === maxCount).map((item) => item.rating),
        )

  return {
    ratingData,
    totalReviews,
    averageRating:
      totalReviews === 0 ? 0 : Math.round((weightedSum / totalReviews) * 10) / 10,
    maxCount,
    mostGivenRating,
  }
}
