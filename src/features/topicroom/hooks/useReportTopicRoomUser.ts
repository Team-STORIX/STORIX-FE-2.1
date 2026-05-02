import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reportTopicRoomUser } from '../api/topicroom.api'

type Vars = {
  roomId: number
  reportedUserId: number
  reason: string
  otherReason?: string | null
}

export const useReportTopicRoomUser = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: ['topicroom', 'report'],
    mutationFn: (vars: Vars) =>
      reportTopicRoomUser(vars.roomId, {
        reportedUserId: vars.reportedUserId,
        reason: vars.reason,
        otherReason: vars.otherReason ?? null,
      }),
    onSettled: async (_data, _error, vars) => {
      await qc.invalidateQueries({
        queryKey: ['topicroom', 'members', vars.roomId],
      })
    },
  })
}
