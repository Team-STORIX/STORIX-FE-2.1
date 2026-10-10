import { useCallback } from 'react'
import { BackHandler, Platform } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

/**
 * Android 하드웨어 뒤로가기를 화면이 포커스된 동안만 가로챈다.
 * handler 가 true 를 돌려주면 기본 동작(스택 pop / 앱 종료)을 막는다.
 */
export function useAndroidBackHandler(handler: () => boolean) {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined

      const subscription = BackHandler.addEventListener('hardwareBackPress', handler)
      return () => subscription.remove()
    }, [handler]),
  )
}
