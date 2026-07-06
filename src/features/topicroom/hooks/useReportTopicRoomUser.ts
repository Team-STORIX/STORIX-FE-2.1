import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reportTopicRoomUser } from '../api/topicroom.api'
import type { TopicRoomReportReason } from '../api/topicroom.schema'

type Vars = {
  roomId: number
  reportedUserId: number
  chatMessageId?: number | null
  reason: TopicRoomReportReason
  otherReason?: string | null
}

export const useReportTopicRoomUser = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: ['topicroom', 'report'],
    mutationFn: (vars: Vars) =>
      reportTopicRoomUser(vars.roomId, {
        reportedUserId: vars.reportedUserId,
        ...(vars.chatMessageId != null
          ? { chatMessageId: vars.chatMessageId }
          : {}),
        reason: vars.reason,
        ...(vars.otherReason != null ? { otherReason: vars.otherReason } : {}),
      }),
    onSettled: async (_data, _error, vars) => {
      await qc.invalidateQueries({
        queryKey: ['topicroom', 'members', vars.roomId],
      })
    },
  })
}
