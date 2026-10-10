import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { joinTopicRoom } from '../api/topicroom.api'
import type { TopicRoomItem } from '../api/topicroom.schema'
import { assertCanJoinTopicRoom } from '../services/topicRoomLimit'

type JoinResult =
  | { joined: true; alreadyJoined?: false; room?: TopicRoomItem }
  | { joined: true; alreadyJoined: true }

export const useJoinTopicRoom = () => {
  const qc = useQueryClient()

  return useMutation<JoinResult, unknown, number>({
    mutationKey: ['topicroom', 'join'],
    mutationFn: async (roomId: number) => {
      const limit = await assertCanJoinTopicRoom(roomId)
      if (limit.alreadyJoined) {
        return { joined: true, alreadyJoined: true }
      }

      try {
        const room = await joinTopicRoom(roomId)
        return {
          joined: true,
          room:
            room && typeof room === 'object' && 'topicRoomId' in room
              ? (room as TopicRoomItem)
              : undefined,
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          return { joined: true, alreadyJoined: true }
        }
        throw err
      }
    },
    onSettled: async (_data, _error, roomId) => {
      if (_data && 'room' in _data && _data.room) {
        qc.setQueryData(['topicroom', 'room', roomId], _data.room)
      }
      await qc.invalidateQueries({ queryKey: ['topicroom'] })
      await qc.invalidateQueries({ queryKey: ['topicroom', 'info'] })
      await qc.invalidateQueries({ queryKey: ['topicroom', 'room', roomId] })
    },
  })
}
