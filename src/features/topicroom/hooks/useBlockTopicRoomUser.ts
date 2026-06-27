import { useMutation, useQueryClient } from '@tanstack/react-query'
import { blockUser } from '../../users/api/users.api'

type Vars = {
  /** Room whose member list should be refreshed after a successful block. */
  roomId: number
  /** The user being blocked. */
  targetUserId: number
}

// POST /api/v1/users/{targetUserId}/block — shared user-level block endpoint
// (reused from the feed feature). The backend returns no meaningful body, so
// blockUser() resolves void; callers act on the resolved/rejected promise only.
export const useBlockTopicRoomUser = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: ['topicroom', 'block'],
    mutationFn: (vars: Vars) => blockUser(vars.targetUserId),
    onSuccess: async (_data, vars) => {
      // Refresh the room roster so a now-blocked participant drops out of any
      // member-derived UI (report picker, avatars). Old chat messages are not
      // touched — future filtering follows the backend contract.
      await qc.invalidateQueries({
        queryKey: ['topicroom', 'members', vars.roomId],
      })
    },
  })
}