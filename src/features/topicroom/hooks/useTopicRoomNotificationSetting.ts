import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTopicRoomNotificationSetting,
  updateTopicRoomNotificationSetting,
} from '../api/topicroom.api'
import type { TopicRoomNotificationSetting } from '../api/topicroom.schema'

export const topicRoomNotificationSettingKey = (roomId: number) =>
  ['topicroom', 'notification', roomId] as const

export function useTopicRoomNotificationSetting(
  roomId: number,
  enabled = true,
) {
  return useQuery({
    queryKey: topicRoomNotificationSettingKey(roomId),
    queryFn: () => getTopicRoomNotificationSetting(roomId),
    enabled: enabled && Number.isFinite(roomId) && roomId > 0,
  })
}

export function useUpdateTopicRoomNotificationSetting(roomId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (enabled: boolean) =>
      updateTopicRoomNotificationSetting(roomId, { enabled }),
    onMutate: async (enabled) => {
      const key = topicRoomNotificationSettingKey(roomId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<TopicRoomNotificationSetting>(
        key,
      )
      queryClient.setQueryData<TopicRoomNotificationSetting>(key, { enabled })
      return { previous }
    },
    onError: (_error, _enabled, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          topicRoomNotificationSettingKey(roomId),
          context.previous,
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: topicRoomNotificationSettingKey(roomId),
      })
      queryClient.invalidateQueries({ queryKey: ['topicroom', 'me'] })
    },
  })
}
