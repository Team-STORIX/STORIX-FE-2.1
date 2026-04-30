// src/lib/api/favorite/favorite.schema.ts
import { z } from 'zod'

export const ApiEnvelopeSchema = <T extends z.ZodTypeAny>(result: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string(),
    message: z.string(),
    result,
    timestamp: z.string(),
  })

export const FavoriteWorkStatusSchema = z.object({
  isFavoriteWorks: z.boolean(),
})

export const FavoriteWorkStatusEnvelopeSchema = ApiEnvelopeSchema(
  FavoriteWorkStatusSchema,
)
