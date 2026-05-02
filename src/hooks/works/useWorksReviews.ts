import { useEffect } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  deleteMyReview,
  getWorksMyReview,
  getWorksReviewDetail,
  getWorksReviews,
  postUpdateMyReview,
  postWorksReviewLike,
  postWorksReviewReport,
  type UpdateMyReviewPayload,
} from '../../lib/api/works/worksReview.api'

export const useWorksMyReview = (worksId: number) =>
  useQuery({
    queryKey: ['works', 'review', 'me', worksId],
    enabled: Number.isFinite(worksId) && worksId > 0,
    queryFn: () => getWorksMyReview(worksId),
  })

export const useWorksReviewsInfinite = (worksId: number) =>
  useInfiniteQuery({
    queryKey: ['works', 'review', 'list', worksId],
    enabled: Number.isFinite(worksId) && worksId > 0,
    queryFn: ({ pageParam }) =>
      getWorksReviews({ worksId, page: Number(pageParam) }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last || lastPage.empty) return undefined
      return (lastPage.number ?? 0) + 1
    },
  })

export const useWorksReviewDetail = (reviewId: number) =>
  useQuery({
    queryKey: ['works', 'review', 'detail', reviewId],
    enabled: Number.isFinite(reviewId) && reviewId > 0,
    queryFn: () => getWorksReviewDetail(reviewId),
  })

export const useLikeWorksReview = (params: { worksId: number }) => {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: (reviewId: number) => postWorksReviewLike(reviewId),
  })
  useEffect(() => {
    if (!m.isSuccess) return
    qc.invalidateQueries({ queryKey: ['works', 'review', 'list', params.worksId] })
    qc.invalidateQueries({ queryKey: ['works', 'review', 'detail'] })
  }, [m.isSuccess, qc, params.worksId])
  return m
}

export const useReportWorksReview = () =>
  useMutation({
    mutationFn: (p: { reviewId: number; payload?: unknown }) =>
      postWorksReviewReport(p),
  })

export const useUpdateMyReview = (params: { worksId: number }) => {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: (p: { reviewId: number; payload: UpdateMyReviewPayload }) =>
      postUpdateMyReview(p),
  })
  useEffect(() => {
    if (!m.isSuccess) return
    qc.invalidateQueries({ queryKey: ['works', 'review', 'me', params.worksId] })
    qc.invalidateQueries({ queryKey: ['works', 'review', 'list', params.worksId] })
    qc.invalidateQueries({ queryKey: ['works', 'review', 'detail'] })
  }, [m.isSuccess, qc, params.worksId])
  return m
}

export const useDeleteMyReview = (params: { worksId: number }) => {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: (reviewId: number) => deleteMyReview(reviewId),
  })
  useEffect(() => {
    if (!m.isSuccess) return
    qc.invalidateQueries({ queryKey: ['works', 'review', 'me', params.worksId] })
    qc.invalidateQueries({ queryKey: ['works', 'review', 'list', params.worksId] })
  }, [m.isSuccess, qc, params.worksId])
  return m
}
