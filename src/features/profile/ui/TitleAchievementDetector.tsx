import { useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMe } from '../hooks/useMe'
import { TitleAchievementModal } from './TitleAchievementModal'

const LAST_TITLE_KEY = '@storix/lastTitle'

export function TitleAchievementDetector() {
  const { data: me } = useMe()
  const previousTitleRef = useRef<string | null | undefined>(undefined)
  const [achievementModal, setAchievementModal] = useState<{
    title: string
    nickname: string
  } | null>(null)

  useEffect(() => {
    if (!me) return

    const currentTitle = me.title?.trim() || null
    const previousTitle = previousTitleRef.current
    previousTitleRef.current = currentTitle

    const checkTitleChange = async () => {
      try {
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
          setAchievementModal({
            title: currentTitle,
            nickname: me.nickName,
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
  }, [me])

  return (
    <TitleAchievementModal
      visible={achievementModal != null}
      onClose={() => setAchievementModal(null)}
      title={achievementModal?.title ?? ''}
      nickname={achievementModal?.nickname ?? ''}
    />
  )
}
