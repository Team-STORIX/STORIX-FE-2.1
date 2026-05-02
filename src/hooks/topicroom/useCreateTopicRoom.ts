import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTopicRoom } from '../../lib/api/topicroom/topicroom.api'

type Vars = { worksId: number; topicRoomName: string }

export function useCreateTopicRoom() {
  const queryClient = useQueryClient()
  const didInvalidateRef = useRef(false)

  const mutation = useMutation({
    mutationFn: (vars: Vars) => createTopicRoom(vars),
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
