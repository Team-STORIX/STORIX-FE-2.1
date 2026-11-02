import { Image } from 'expo-image'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { C, Gray, Radius, Typography } from '../../../theme'

const exitIcon = require('../../../../assets/topicroom/icon-topicroom-exit.svg')
const notificationOnIcon = require('../../../../assets/topicroom/icon-notification-on.svg')
const notificationOffIcon = require('../../../../assets/topicroom/icon-notification-off.svg')

type Props = {
  visible: boolean
  /** Y position (px from top of screen) to anchor the dropdown under the header. */
  topOffset: number
  notificationEnabled: boolean
  onClose: () => void
  onPressToggleNotification: () => void
  onPressLeave: () => void
  notificationPending?: boolean
  leaveDisabled?: boolean
}

export function TopicRoomMenuDropdown({
  visible,
  topOffset,
  notificationEnabled,
  onClose,
  onPressToggleNotification,
  onPressLeave,
  notificationPending = false,
  leaveDisabled = false,
}: Props) {
  const notificationActionLabel = notificationEnabled ? '알림끄기' : '알림켜기'
  const notificationActionIcon = notificationEnabled
    ? notificationOffIcon
    : notificationOnIcon

  return (
    <Modal
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[styles.box, { top: topOffset }]}>
          <View style={styles.menu}>
            <Pressable
              disabled={notificationPending}
              onPress={() => {
                onClose()
                onPressToggleNotification()
              }}
              style={({ pressed }) => [
                styles.row,
                pressed && !notificationPending && styles.rowPressed,
                notificationPending && styles.disabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={notificationActionLabel}
            >
              <Text style={styles.rowText}>{notificationActionLabel}</Text>
              <Image
                source={notificationActionIcon}
                style={styles.rowIcon}
                contentFit="contain"
              />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              disabled={leaveDisabled}
              onPress={() => {
                onClose()
                onPressLeave()
              }}
              style={({ pressed }) => [
                styles.row,
                pressed && !leaveDisabled && styles.rowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="토픽룸 퇴장하기"
            >
              <Text style={[styles.rowText, leaveDisabled && styles.disabled]}>
                퇴장하기
              </Text>
              <Image source={exitIcon} style={styles.rowIcon} contentFit="contain" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  box: {
    position: 'absolute',
    right: 16,
  },
  menu: {
    width: 96,
    backgroundColor: C.card,
    borderRadius: Radius.xs,
    padding: 8,
    shadowColor: Gray[900],
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 80,
    height: 20,
  },
  rowIcon: {
    width: 20,
    height: 20,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowText: {
    ...Typography.body2Medium,
    color: Gray[500],
  },
  disabled: {
    opacity: 0.4,
  },
  divider: {
    width: 80,
    height: 1,
    marginVertical: 6,
    backgroundColor: Gray[100],
  },
})
