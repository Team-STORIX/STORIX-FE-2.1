import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { leaveTopicRoom } from '../api/topicroom.api'

export const useLeaveTopicRoom = () => {
  const qc = useQueryClient()
  const didInvalidateRef = useRef(false)

  const mutation = useMutation({
    mutationFn: (roomId: number) => leaveTopicRoom(roomId),
  })

  useEffect(() => {
    if (!mutation.isSuccess || didInvalidateRef.current) return
    didInvalidateRef.current = true
    qc.invalidateQueries({ queryKey: ['topicroom'] })
  }, [mutation.isSuccess, qc])

  useEffect(() => {
    if (mutation.isPending) didInvalidateRef.current = false
  }, [mutation.isPending])

  return mutation
}
