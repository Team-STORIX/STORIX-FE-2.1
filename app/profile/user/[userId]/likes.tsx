import { useLocalSearchParams } from 'expo-router'
import { OtherUserLikesScreen } from '../../../../src/features/profile'

export default function OtherUserLikesRoute() {
  const { userId: userIdParam } = useLocalSearchParams<{ userId: string }>()
  const userId = typeof userIdParam === 'string' ? Number(userIdParam) : NaN

  return <OtherUserLikesScreen userId={Number.isFinite(userId) ? userId : 0} />
}
