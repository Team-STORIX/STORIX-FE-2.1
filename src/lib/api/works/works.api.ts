import { z } from 'zod'
import { apiClient } from '../axios-instance'
import { ApiEnvelopeSchema } from './works.schema'

const WorksDetailSchema = z.object({
  worksId: z.number(),
  worksName: z.string(),
  worksType: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  illustrator: z.string().nullable().optional(),
  originalAuthor: z.string().nullable().optional(),
  genre: z.string().nullable().optional(),
  platforms: z.array(z.string()).optional(),
  ageClassification: z.string().nullable().optional(),
  hasTopicRoom: z.boolean().optional(),
  avgRating: z
    .preprocess((v) => (v == null ? v : Number(v)), z.number())
    .nullable()
    .optional(),
  reviewCount: z
    .preprocess((v) => (v == null ? v : Number(v)), z.number())
    .nullable()
    .optional(),
  description: z.string().nullable().optional(),
  hashtags: z.array(z.string()).optional(),
})

const WorksDetailResponseSchema = ApiEnvelopeSchema(WorksDetailSchema)

export type WorksDetail = z.infer<typeof WorksDetailSchema>

export async function getWorksDetail(worksId: number): Promise<WorksDetail> {
  const res = await apiClient.get(`/api/v1/works/${worksId}`, {
    headers: { accept: '*/*' },
  })
  const parsed = WorksDetailResponseSchema.parse(res.data)
  return parsed.result
}
