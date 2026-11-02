import { apiClient } from '../../../lib/api/axios-instance'

// POST /api/v1/users/{targetUserId}/block
export const blockUser = async (targetUserId: number): Promise<void> => {
  await apiClient.post(`/api/v1/users/${targetUserId}/block`)
}
