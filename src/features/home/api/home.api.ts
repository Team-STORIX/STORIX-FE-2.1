import { apiClient } from '../../../lib/api/axios-instance'
import { TodayFeedEnvelopeSchema } from '../../../lib/api/homeFeed/homeFeed.schema'

/** GET /api/v1/home/feeds/today */
export async function getTodayHomeFeeds() {
  const res = await apiClient.get('/api/v1/home/feeds/today', {
    headers: { accept: '*/*' },
  })
  return TodayFeedEnvelopeSchema.parse(res.data).result
}
