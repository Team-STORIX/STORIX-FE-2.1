import axios from 'axios'
import { apiClient } from '../../../../lib/api/axios-instance'

export type ReportReplyArgs = {
  boardId: number
  replyId: number
  reportedUserId?: number
}

// POST /api/v1/feed/reader/board/{boardId}/reply/{replyId}/report
export const reportReply = async ({
  boardId,
  replyId,
  reportedUserId,
}: ReportReplyArgs) => {
  if (!Number.isFinite(boardId) || !Number.isFinite(replyId)) {
    throw new Error('Invalid boardId/replyId')
  }
  const body =
    typeof reportedUserId === 'number' && Number.isFinite(reportedUserId)
      ? { reportedUserId }
      : undefined
  const res = await apiClient.post(
    `/api/v1/feed/reader/board/${boardId}/reply/${replyId}/report`,
    body,
  )
  return res.data
}

/** Returns true when the error indicates a duplicate report (already reported). */
export const isAlreadyReportedError = (e: unknown): boolean => {
  if (!axios.isAxiosError(e)) return false
  const data = e.response?.data as any
  const msg = String(data?.message ?? '')
  const code = String(data?.code ?? '')
  return (
    (msg.includes('이미') && msg.includes('신고')) ||
    code.toUpperCase().includes('ALREADY') ||
    code.toUpperCase().includes('DUPLICATE')
  )
}
