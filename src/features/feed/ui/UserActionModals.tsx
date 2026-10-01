import { useCallback, useState } from 'react'
import { UserActionModal } from '../../../components/common/UserActionModal'

type TargetProfile = { profileImageUrl?: string | null; nickName: string }
type Confirm = () => Promise<void | 'duplicate'>
type Target = TargetProfile & { onConfirm: Confirm }

const noop = () => Promise.resolve()

/** Report/block confirmation modals shared by the feed list and detail screens. */
export function useUserActionModals() {
  const [report, setReport] = useState<Target | null>(null)
  const [block, setBlock] = useState<Target | null>(null)

  const openReport = useCallback(
    (profile: TargetProfile, onConfirm: Confirm) => setReport({ ...profile, onConfirm }),
    [],
  )
  const openBlock = useCallback(
    (profile: TargetProfile, onConfirm: Confirm) => setBlock({ ...profile, onConfirm }),
    [],
  )

  const modals = (
    <>
      <UserActionModal
        type="report"
        visible={report != null}
        profileImageUrl={report?.profileImageUrl}
        nickname={report?.nickName ?? ''}
        onClose={() => setReport(null)}
        onConfirm={report?.onConfirm ?? noop}
      />
      <UserActionModal
        type="block"
        visible={block != null}
        profileImageUrl={block?.profileImageUrl}
        nickname={block?.nickName ?? ''}
        onClose={() => setBlock(null)}
        onConfirm={block?.onConfirm ?? noop}
      />
    </>
  )

  return { openReport, openBlock, modals }
}
