import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTopicRoom } from '../api/topicroom.api'
import { assertCanCreateTopicRoom } from '../services/topicRoomLimit'

type Vars = { worksId: number; topicRoomName: string }

export function useCreateTopicRoom() {
  const queryClient = useQueryClient()
  const didInvalidateRef = useRef(false)

  const mutation = useMutation({
    mutationFn: async (vars: Vars) => {
      await assertCanCreateTopicRoom()
      return createTopicRoom(vars)
    },
  })

  useEffect(() => {
    if (!mutation.isSuccess || didInvalidateRef.current) return
    didInvalidateRef.current = true
    queryClient.invalidateQueries({ queryKey: ['topicroom'] })
  }, [mutation.isSuccess, queryClient])

  useEffect(() => {
    if (mutation.isPending) didInvalidateRef.current = false
  }, [mutation.isPending])

  return mutation
}
