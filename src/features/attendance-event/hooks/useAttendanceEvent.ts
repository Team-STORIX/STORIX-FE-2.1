import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  attendanceEventKeys,
  checkInAttendanceEvent,
  getAttendanceEventStatus,
} from '../api'

/** GET /api/v1/attendance-event */
export function useAttendanceEventStatus(enabled = true) {
  return useQuery({
    queryKey: attendanceEventKeys.status,
    enabled,
    queryFn: getAttendanceEventStatus,
  })
}

/** POST /api/v1/attendance-event/check-in */
export function useCheckInAttendanceEvent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: checkInAttendanceEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceEventKeys.status })
    },
  })
}
