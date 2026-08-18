import { z } from 'zod'

export const ApiEnvelopeSchema = <T extends z.ZodTypeAny>(result: T) =>
  z.object({
    isSuccess: z.boolean(),
    code: z.string().optional(),
    message: z.string().optional(),
    result,
    timestamp: z.string().optional(),
  })

export const AppVersionPlatformSchema = z.enum(['IOS', 'ANDROID'])
export const AppVersionStatusSchema = z.enum([
  'LATEST',
  'UPDATE_AVAILABLE',
  'UPDATE_REQUIRED',
])

export const AppVersionCheckResultSchema = z.object({
  status: AppVersionStatusSchema,
  latestVersion: z.string(),
  minSupportedVersion: z.string(),
})

export const AppVersionCheckResponseSchema = ApiEnvelopeSchema(
  AppVersionCheckResultSchema,
)

export type AppVersionPlatform = z.infer<typeof AppVersionPlatformSchema>
export type AppVersionStatus = z.infer<typeof AppVersionStatusSchema>
export type AppVersionCheckResult = z.infer<
  typeof AppVersionCheckResultSchema
>

export type AppVersionCheckParams = {
  platform: AppVersionPlatform
  version: string
}
