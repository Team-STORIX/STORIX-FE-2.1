// src/lib/api/works/worksReview.schema.ts
import { z } from 'zod'
import { SliceSchema } from './works.schema'

export const WorksMyReviewSchema = z.object({
  reviewId: z.number(),
  content: z.string().optional(),
  isSpoiler: z.boolean().optional(),
  rating: z
    .preprocess((v) => (v == null ? v : Number(v)), z.number())
    .nullable()
    .optional(),
  likeCount: z
    .preprocess((v) => (v == null ? v : Number(v)), z.number())
    .nullable()
    .optional(),
})

const WorksReviewItemOutputSchema = z.object({
  reviewId: z.number(),
  userName: z.string().optional(),
  content: z.string().optional(),
  isSpoiler: z.boolean().optional(),
  spoilerScript: z.string().optional(),
  rating: z
    .preprocess((v) => (v == null ? v : Number(v)), z.number())
    .nullable()
    .optional(),
  likeCount: z
    .preprocess((v) => (v == null ? v : Number(v)), z.number())
    .nullable()
    .optional(),
  userId: z.number().optional(),
  profileImageUrl: z.string().nullable().optional(),
})

export const WorksReviewItemSchema = z.preprocess((input) => {
  if (input && typeof input === 'object') {
    const obj = input as any

    if (obj.profile && obj.review) {
      return {
        reviewId: obj.review?.reviewId,
        userName: obj.profile?.nickName,
        content: obj.review?.content,
        isSpoiler: obj.review?.isSpoiler,
        spoilerScript: obj.review?.spoilerScript,
        rating: obj.review?.rating,
        likeCount: obj.review?.likeCount,
        userId: obj.profile?.userId,
        profileImageUrl: obj.profile?.profileImageUrl,
      }
    }
  }

  return input
}, WorksReviewItemOutputSchema)

export const WorksReviewSliceSchema = SliceSchema(WorksReviewItemSchema)

const WorksReviewDetailOutputSchema = z.object({
  reviewId: z.number(),
  userName: z.string().optional(),
  profileImageUrl: z.string().nullable().optional(),
  content: z.string().optional(),
  isSpoiler: z.boolean().optional(),
  spoilerScript: z.string().optional(),
  rating: z
    .preprocess((v) => (v == null ? v : Number(v)), z.number())
    .nullable()
    .optional(),
  likeCount: z
    .preprocess((v) => (v == null ? v : Number(v)), z.number())
    .nullable()
    .optional(),
  isLiked: z.boolean().optional(),
  createdAt: z.string().optional(),
  lastCreatedTime: z.string().optional(),
  worksId: z.number().optional(),
  worksName: z.string().optional(),
  artistName: z.string().optional(),
  worksType: z.string().optional(),
  thumbnailUrl: z.string().optional(),
})

export const WorksReviewDetailSchema = z.preprocess((input) => {
  if (input && typeof input === 'object') {
    let obj: any = input

    for (let i = 0; i < 3; i++) {
      if (obj && typeof obj === 'object' && 'result' in obj) {
        const next = obj.result
        if (next && typeof next === 'object') obj = next
        else break
      } else {
        break
      }
    }

    if (obj.profile && obj.review) {
      return {
        reviewId: obj.review?.reviewId,
        userName: obj.profile?.nickName ?? obj.profile?.userName,
        profileImageUrl: obj.profile?.profileImageUrl,
        content: obj.review?.content,
        isSpoiler: obj.review?.isSpoiler,
        spoilerScript: obj.review?.spoilerScript,
        rating: obj.review?.rating,
        likeCount: obj.review?.likeCount,
        isLiked: obj.review?.isLiked,
        createdAt: obj.review?.createdAt ?? obj.review?.createdDate,
        lastCreatedTime: obj.review?.lastCreatedTime,
        worksId: obj.works?.worksId ?? obj.review?.worksId,
        worksName: obj.works?.worksName ?? obj.works?.title,
        artistName: obj.works?.artistName,
        worksType: obj.works?.worksType,
        thumbnailUrl: obj.works?.thumbnailUrl,
      }
    }

    if (obj.works && (obj.reviewId || obj.review?.reviewId)) {
      return {
        reviewId: obj.reviewId ?? obj.review?.reviewId,
        userName: obj.userName,
        profileImageUrl: obj.profileImageUrl,
        content: obj.content,
        isSpoiler: obj.isSpoiler,
        spoilerScript: obj.spoilerScript,
        rating: obj.rating,
        likeCount: obj.likeCount,
        isLiked: obj.isLiked,
        createdAt: obj.createdAt ?? obj.createdDate,
        lastCreatedTime: obj.lastCreatedTime,
        worksId: obj.works?.worksId,
        worksName: obj.works?.worksName ?? obj.works?.title,
        artistName: obj.works?.artistName,
        worksType: obj.works?.worksType,
        thumbnailUrl: obj.works?.thumbnailUrl,
      }
    }
  }

  return input
}, WorksReviewDetailOutputSchema)

export type WorksMyReview = z.infer<typeof WorksMyReviewSchema>
export type WorksReviewItem = z.infer<typeof WorksReviewItemSchema>
export type WorksReviewSlice = z.infer<typeof WorksReviewSliceSchema>
export type WorksReviewDetail = z.infer<typeof WorksReviewDetailSchema>
