import {
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { C, Gray, Radius, Typography } from '../../../theme'
import type { AppVersionCheckResult } from '../api'

type AppVersionUpdateModalProps = {
  visible: boolean
  result?: AppVersionCheckResult | null
  onClose: () => void
}

const IOS_STORE_URL =
  process.env.EXPO_PUBLIC_IOS_STORE_URL ??
  'itms-apps://itunes.apple.com/search?term=STORIX'
const IOS_STORE_WEB_URL =
  process.env.EXPO_PUBLIC_IOS_STORE_WEB_URL ??
  'https://apps.apple.com/search?term=STORIX'
const ANDROID_STORE_URL =
  process.env.EXPO_PUBLIC_ANDROID_STORE_URL ??
  'market://details?id=kr.storix.app'
const ANDROID_STORE_WEB_URL =
  process.env.EXPO_PUBLIC_ANDROID_STORE_WEB_URL ??
  'https://play.google.com/store/apps/details?id=kr.storix.app'

export function AppVersionUpdateModal({
  visible,
  result,
  onClose,
}: AppVersionUpdateModalProps) {
  const isRequired = result?.status === 'UPDATE_REQUIRED'
  const showLater = result?.status === 'UPDATE_AVAILABLE'

  const openStore = async () => {
    const appUrl = Platform.OS === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL
    const webUrl =
      Platform.OS === 'ios' ? IOS_STORE_WEB_URL : ANDROID_STORE_WEB_URL

    try {
      await Linking.openURL(appUrl)
    } catch {
      await Linking.openURL(webUrl)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isRequired ? () => undefined : onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>
            스토릭스의 새로운 버전이{'\n'}출시되었어요!
          </Text>
          <Text style={styles.body}>
            더 나은 서비스 이용을 위해{'\n'}최신 버전으로 업데이트해 주세요.
          </Text>

          <View style={styles.actions}>
            {showLater ? (
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.pressed,
                ]}
                onPress={onClose}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryText}>나중에</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                !showLater && styles.fullBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                void openStore()
              }}
              accessibilityRole="button"
            >
              <Text style={styles.primaryText}>업데이트하기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: 306,
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: C.black,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
    textAlign: 'center',
  },
  body: {
    marginTop: 20,
    ...Typography.body2Medium,
    color: C.textSecondary,
    textAlign: 'center',
  },
  actions: {
    marginTop: 28,
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Gray[200],
    backgroundColor: Gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    ...Typography.body1Medium,
    color: C.textSecondary,
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: C.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullBtn: {
    flex: 0,
    width: '100%',
  },
  primaryText: {
    ...Typography.body1Medium,
    color: C.card,
  },
  pressed: {
    opacity: 0.85,
  },
})
