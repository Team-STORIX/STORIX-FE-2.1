import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { joinTopicRoom } from '../../lib/api/topicroom/topicroom.api'

type JoinResult =
  | { joined: true; alreadyJoined?: false }
  | { joined: true; alreadyJoined: true }

export const useJoinTopicRoom = () => {
  const qc = useQueryClient()

  return useMutation<JoinResult, unknown, number>({
    mutationKey: ['topicroom', 'join'],
    mutationFn: async (roomId: number) => {
      try {
        await joinTopicRoom(roomId)
        return { joined: true }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          return { joined: true, alreadyJoined: true }
        }
        throw err
      }
    },
    onSettled: async (_data, _error, roomId) => {
      await qc.invalidateQueries({ queryKey: ['topicroom'] })
      await qc.invalidateQueries({ queryKey: ['topicroom', 'info'] })
      await qc.invalidateQueries({ queryKey: ['topicroom', 'room', roomId] })
    },
  })
}
