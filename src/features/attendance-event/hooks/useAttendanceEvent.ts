import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  attendanceEventKeys,
  checkInAttendanceEvent,
  getAttendanceEventStatus,
  type AttendanceEventStatus,
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
    onSuccess: (result) => {
      qc.setQueryData<AttendanceEventStatus>(attendanceEventKeys.status, (current) => {
        if (!current) return current

        const attendedDate = result.attendedDate.slice(0, 10)
        const attendedDates = current.attendedDates.includes(attendedDate)
          ? current.attendedDates
          : [...current.attendedDates, attendedDate]

        return {
          ...current,
          attendedDates,
          totalAttendedDays: result.totalAttendedDays,
          attendedToday: true,
          issuedTickets: result.issuedTickets,
        }
      })
    },
    onError: (error) => {
      // 409 = already attended today: our cached status is stale, so refresh it
      // to reflect the server's attendedToday state.
      if (isAxiosError(error) && error.response?.status === 409) {
        qc.invalidateQueries({ queryKey: attendanceEventKeys.status })
      }
    },
  })
}
