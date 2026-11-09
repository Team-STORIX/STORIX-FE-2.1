import { useLocalSearchParams } from 'expo-router'
import { OtherUserProfileScreen } from '../../../src/features/profile'

export default function OtherUserProfileRoute() {
  const { userId: userIdParam } = useLocalSearchParams<{ userId: string }>()
  const userId = typeof userIdParam === 'string' ? Number(userIdParam) : NaN

  return <OtherUserProfileScreen userId={Number.isFinite(userId) ? userId : 0} />
}
