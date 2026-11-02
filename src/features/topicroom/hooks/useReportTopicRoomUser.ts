import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reportTopicRoomUser } from '../api/topicroom.api'

type Vars = {
  roomId: number
  reportedUserId: number
  chatMessageId?: number | null
  reason?: 'DEFAULT'
}

export const useReportTopicRoomUser = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: ['topicroom', 'report'],
    mutationFn: (vars: Vars) => {
      const body = {
        reportedUserId: vars.reportedUserId,
        ...(vars.chatMessageId != null
          ? { chatMessageId: vars.chatMessageId }
          : {}),
        ...(vars.reason != null ? { reason: vars.reason } : {}),
      }

      if (__DEV__) {
        console.log('[topicroom][report] mutation-start', {
          roomId: vars.roomId,
          reportType: body.chatMessageId != null ? 'chat-message' : 'user',
          reportedUserId: body.reportedUserId,
          chatMessageId: body.chatMessageId ?? null,
          reason: body.reason ?? null,
          payloadKeys: Object.keys(body),
        })
      }

      return reportTopicRoomUser(vars.roomId, body)
    },
    onError: (error, vars) => {
      if (__DEV__) {
        console.log('[topicroom][report] mutation-error', {
          roomId: vars.roomId,
          message: error instanceof Error ? error.message : String(error),
          reportedUserId: vars.reportedUserId,
          chatMessageId: vars.chatMessageId ?? null,
          reason: vars.reason ?? null,
        })
      }
    },
    onSettled: async (_data, _error, vars) => {
      await qc.invalidateQueries({
        queryKey: ['topicroom', 'members', vars.roomId],
      })
    },
  })
}
