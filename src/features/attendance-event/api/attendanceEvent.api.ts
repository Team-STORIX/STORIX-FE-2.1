import { apiClient } from '../../../lib/api/axios-instance'
import {
  AttendanceEventCheckInResponseSchema,
  AttendanceEventStatusResponseSchema,
  type AttendanceEventCheckInResult,
  type AttendanceEventStatus,
} from './attendanceEvent.schema'

const BASE = '/api/v1/attendance-event'

/** GET /api/v1/attendance-event */
export async function getAttendanceEventStatus(): Promise<AttendanceEventStatus> {
  const res = await apiClient.get(BASE)
  return AttendanceEventStatusResponseSchema.parse(res.data).result
}

/** POST /api/v1/attendance-event/check-in */
export async function checkInAttendanceEvent(): Promise<AttendanceEventCheckInResult> {
  const res = await apiClient.post(`${BASE}/check-in`)
  return AttendanceEventCheckInResponseSchema.parse(res.data).result
}
