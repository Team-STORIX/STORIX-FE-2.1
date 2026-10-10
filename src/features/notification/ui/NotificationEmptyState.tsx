import { StyleSheet, View } from 'react-native'
import { WarningEmptyState } from '../../../components/common/WarningEmptyState'

/**
 * Empty state for the notification list (Figma 7086:23633 notify_result_no).
 * Reuses the shared WarningEmptyState pattern, vertically centered.
 */
export function NotificationEmptyState() {
  return (
    <View style={styles.container}>
      <WarningEmptyState
        title="알림이 없어요"
        description="새로운 알림이 도착하면 알려드릴게요."
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
})
