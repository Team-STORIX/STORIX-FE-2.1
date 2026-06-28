import { useCallback, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMe } from '../hooks/useMe'
import { TitleAchievementModal } from './TitleAchievementModal'

const LAST_TITLE_KEY = '@storix/lastTitle'
const PENDING_TITLE_MODAL_KEY = '@storix/pendingTitleModal'

type TitleAchievementPayload = {
  title: string
  nickname: string
  topGenre: string | null
}

export function TitleAchievementDetector() {
  const { data: me } = useMe()
  const previousTitleRef = useRef<string | null | undefined>(undefined)
  const [achievementModal, setAchievementModal] = useState<TitleAchievementPayload | null>(null)
  const shownPendingRef = useRef(false)

  const showAchievementModal = useCallback(async (payload: TitleAchievementPayload) => {
    await AsyncStorage.setItem(PENDING_TITLE_MODAL_KEY, JSON.stringify(payload))
    setAchievementModal(payload)
  }, [])

  const handleClose = useCallback(async () => {
    setAchievementModal(null)
    try {
      await AsyncStorage.removeItem(PENDING_TITLE_MODAL_KEY)
    } catch (error) {
      console.error('Failed to clear pending title modal:', error)
    }
  }, [])

  useEffect(() => {
    if (!me) return

    const currentTitle = me.title?.trim() || null
    const previousTitle = previousTitleRef.current
    previousTitleRef.current = currentTitle

    const checkTitleChange = async () => {
      try {
        if (!shownPendingRef.current) {
          const pendingModal = await AsyncStorage.getItem(PENDING_TITLE_MODAL_KEY)
          if (pendingModal) {
            try {
              const parsed = JSON.parse(pendingModal) as TitleAchievementPayload
              shownPendingRef.current = true
              if (parsed.title) {
                await AsyncStorage.setItem(LAST_TITLE_KEY, parsed.title)
              }
              setAchievementModal(parsed)
              return
            } catch {
              await AsyncStorage.removeItem(PENDING_TITLE_MODAL_KEY)
            }
          }
          shownPendingRef.current = true
        }

        const lastTitle = await AsyncStorage.getItem(LAST_TITLE_KEY)
        const changedInSession =
          previousTitle !== undefined &&
          previousTitle !== currentTitle &&
          currentTitle != null
        const changedFromStored =
          lastTitle != null &&
          lastTitle !== currentTitle &&
          currentTitle != null

        if (changedInSession || changedFromStored) {
          await showAchievementModal({
            title: currentTitle,
            nickname: me.nickName,
            topGenre: me.topGenre || null,
          })
        }

        // 현재 칭호 저장
        if (currentTitle) {
          await AsyncStorage.setItem(LAST_TITLE_KEY, currentTitle)
        } else {
          await AsyncStorage.removeItem(LAST_TITLE_KEY)
        }
      } catch (error) {
        console.error('Failed to check title change:', error)
      }
    }

    checkTitleChange()
  }, [me, showAchievementModal])

  return (
    <TitleAchievementModal
      visible={achievementModal != null}
      onClose={handleClose}
      title={achievementModal?.title ?? ''}
      nickname={achievementModal?.nickname ?? ''}
      topGenre={achievementModal?.topGenre ?? null}
    />
  )
}
