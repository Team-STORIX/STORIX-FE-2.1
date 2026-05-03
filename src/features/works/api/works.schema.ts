// src/lib/api/works/works.schema.ts
import { z } from 'zod'

/** 怨듯넻 API ?섑띁(isSuccess/code/message/result/timestamp) */
export const ApiEnvelopeSchema = <T extends z.ZodTypeAny>(result: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string().optional(),
    message: z.string().optional(),
    result,
    timestamp: z.string().optional(),
  })

/** Spring Slice/Page ?뺥깭(臾댄븳?ㅽ겕濡ㅼ슜) */
export const SliceSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    content: z.array(item),
    number: z.number().optional(),
    size: z.number().optional(),
    numberOfElements: z.number().optional(),
    last: z.boolean().optional(),
    empty: z.boolean().optional(),
    pageable: z.any().optional(),
    sort: z.any().optional(),
    first: z.boolean().optional(),
  })
