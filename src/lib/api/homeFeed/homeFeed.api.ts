import { apiClient } from '../axios-instance'
import { TodayFeedEnvelopeSchema } from './homeFeed.schema'

/** GET /api/v1/home/feeds/today */
export async function getTodayHomeFeeds() {
  const res = await apiClient.get('/api/v1/home/feeds/today', {
    headers: { accept: '*/*' },
  })
  return TodayFeedEnvelopeSchema.parse(res.data).result
}
