import { z } from 'zod'

export const AdultVerificationStateSchema = z.enum([
  'NOT_VERIFIED',
  'VERIFIED',
  'EXPIRED',
])

export const AdultVerificationStatusSchema = z.object({
  userId: z.number(),
  state: AdultVerificationStateSchema,
  canVerify: z.boolean(),
  verifiedAt: z.string().nullable().optional().transform((value) => value ?? null),
  expiresAt: z.string().nullable().optional().transform((value) => value ?? null),
})

export const AdultVerificationTicketSchema = z.object({
  identityVerificationId: z.string().min(1),
  storeId: z.string().min(1),
  channelKey: z.string().min(1),
})

const successEnvelope = <T extends z.ZodType>(result: T) =>
  z.object({
    isSuccess: z.literal(true),
    code: z.string(),
    message: z.string(),
    result,
    timestamp: z.string(),
  })

export const AdultVerificationStatusResponseSchema = successEnvelope(
  AdultVerificationStatusSchema,
)

export const AdultVerificationTicketResponseSchema = successEnvelope(
  AdultVerificationTicketSchema,
)

export type AdultVerificationState = z.infer<
  typeof AdultVerificationStateSchema
>
export type AdultVerificationStatus = z.infer<
  typeof AdultVerificationStatusSchema
>
export type AdultVerificationTicket = z.infer<
  typeof AdultVerificationTicketSchema
>
