import { requireOptionalNativeModule } from 'expo-modules-core'

export interface TopicRoomNotificationSender {
  id: string
  nickname: string
  profileImageUrl?: string | null
}

export interface TopicRoomNotificationOptions {
  roomId: number
  threadId: string
  roomName: string
  displayTitle: string
  message: string
  messageCount: number
  senderName: string
  senderId: string
  senderProfileImageUrl?: string | null
  recentSenders: TopicRoomNotificationSender[]
  data: Record<string, string>
}

interface TopicRoomNotificationNativeModule {
  display(options: TopicRoomNotificationOptions): Promise<void>
  cancel(threadId: string): Promise<void>
}

export default requireOptionalNativeModule<TopicRoomNotificationNativeModule>(
  'StorixTopicRoomNotification',
)
