import { apiClient } from '../axios-instance'
import { FavoriteWorkStatusEnvelopeSchema } from './favorite.schema'

export async function getFavoriteWorkStatus(worksId: number) {
  const res = await apiClient.get(`/api/v1/favorite/works/${worksId}`)
  return FavoriteWorkStatusEnvelopeSchema.parse(res.data).result.isFavoriteWorks
}

export async function favoriteWork(worksId: number) {
  const res = await apiClient.post(`/api/v1/favorite/works/${worksId}`)
  return FavoriteWorkStatusEnvelopeSchema.parse(res.data).result.isFavoriteWorks
}

export async function unfavoriteWork(worksId: number) {
  const res = await apiClient.delete(`/api/v1/favorite/works/${worksId}`)
  return FavoriteWorkStatusEnvelopeSchema.parse(res.data).result.isFavoriteWorks
}
