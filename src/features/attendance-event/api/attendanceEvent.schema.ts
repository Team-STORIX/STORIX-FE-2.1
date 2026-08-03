import { z } from 'zod'

export const ApiEnvelopeSchema = <T extends z.ZodTypeAny>(result: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string().optional(),
    message: z.string().optional(),
    result,
    timestamp: z.string().optional(),
  })

export const AttendanceEventCheckInResultSchema = z.object({
  attendedDate: z.string(),
  totalAttendedDays: z.number(),
  newlyIssuedTickets: z.number(),
  issuedTickets: z.number(),
})

export const AttendanceEventStatusSchema = z.object({
  appEventId: z.number(),
  eventStartDate: z.string(),
  eventEndDate: z.string(),
  attendedDates: z.array(z.string()),
  totalAttendedDays: z.number(),
  attendedToday: z.boolean(),
  issuedTickets: z.number(),
  eventActive: z.boolean(),
})

export const AttendanceEventCheckInResponseSchema = ApiEnvelopeSchema(
  AttendanceEventCheckInResultSchema,
)

export const AttendanceEventStatusResponseSchema = ApiEnvelopeSchema(
  AttendanceEventStatusSchema,
)

export type AttendanceEventCheckInResult = z.infer<
  typeof AttendanceEventCheckInResultSchema
>
export type AttendanceEventStatus = z.infer<typeof AttendanceEventStatusSchema>
