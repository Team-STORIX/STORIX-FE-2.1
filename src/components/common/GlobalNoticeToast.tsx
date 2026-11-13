import { useEffect } from 'react'
import { useNoticeStore } from '../../store/notice.store'
import { Toast } from './Toast'

const VISIBLE_MS = 1500

/** Mounted once at the root; shows notices raised through useNoticeStore. */
export function GlobalNoticeToast() {
  const message = useNoticeStore((s) => s.message)
  const clearNotice = useNoticeStore((s) => s.clearNotice)

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(clearNotice, VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [message, clearNotice])

  // Centered so it never sits on a tab bar or chat input, whatever is underneath.
  return <Toast message={message} position="center" onClose={clearNotice} />
}
