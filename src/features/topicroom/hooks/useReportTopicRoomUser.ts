import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reportTopicRoomUser } from '../api/topicroom.api'

type Vars = {
  roomId: number
  reportedUserId: number
  chatMessageId?: number | null
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
      }),
    onSettled: async (_data, _error, vars) => {
      await qc.invalidateQueries({
        queryKey: ['topicroom', 'members', vars.roomId],
      })
    },
  })
}
