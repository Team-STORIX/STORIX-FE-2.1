import { Stack } from 'expo-router'
import { ComingSoonScreen } from '../../src/features/navigation'

export default function FeedWritePlaceholderScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '피드 작성' }} />
      <ComingSoonScreen
        title="피드 작성"
        description="피드 작성 화면은 다음 단계에서 구현됩니다."
      />
    </>
  )
}
