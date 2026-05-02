import { apiClient } from '../axios-instance'
import { RecommendedHashtagEnvelopeSchema } from './hashtag.schema'

/** GET /api/v1/hashtags/recommendations — 사용자 맞춤 해시태그 추천 */
export async function getRecommendedHashtags() {
  const res = await apiClient.get('/api/v1/hashtags/recommendations', {
    headers: { accept: '*/*' },
  })
  return RecommendedHashtagEnvelopeSchema.parse(res.data).result
}
