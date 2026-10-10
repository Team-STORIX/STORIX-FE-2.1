import { useMutation, useQueryClient } from '@tanstack/react-query'
import { leaveTopicRoom } from '../api/topicroom.api'

export const useLeaveTopicRoom = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (roomId: number) => leaveTopicRoom(roomId),
    onSuccess: (_data, roomId) => {
      // Broad ['topicroom'] invalidation covers the joined list (['topicroom',
      // 'me', ...]), this room's members (['topicroom', 'members', roomId]),
      // room info (['topicroom', 'info', roomId]) and the popular/today feeds
      // whose isJoined flags must refresh after leaving.
      qc.invalidateQueries({ queryKey: ['topicroom'] })
      // Drop the left room's chat history outright so a future re-entry refetches
      // from scratch instead of showing a stale cached transcript.
      qc.removeQueries({ queryKey: ['chat', 'room', 'messages', roomId] })
    },
  })
}
