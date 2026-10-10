import { Image } from 'expo-image'
import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { C, FontFamily, Magenta } from '../../../theme'
import { useDismissAppEventPopup } from '../hooks'

type AppEventPopupModalProps = {
  visible: boolean
  popupId: number
  title?: string | null
  imageUrl?: string | null
  content?: string | null
  ctaText?: string | null
  exposurePolicy: 'ALWAYS_DURING_PERIOD' | 'ONCE_PER_DAY'
  onClose: () => void
  onAction: () => void
}

export function AppEventPopupModal({
  visible,
  popupId,
  title,
  imageUrl,
  content,
  ctaText,
  exposurePolicy,
  onClose,
  onAction,
}: AppEventPopupModalProps) {
  const dismissMutation = useDismissAppEventPopup()
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const normalizedImageUrl = imageUrl?.trim() || null
  const canShowImage = normalizedImageUrl != null && failedImageUrl !== normalizedImageUrl
  const actionLabel = ctaText?.trim() || '자세히 보기'
  const showDailyDismiss = exposurePolicy === 'ONCE_PER_DAY'

  const handleDismissForToday = async () => {
    if (dismissMutation.isPending) return

    try {
      await dismissMutation.mutateAsync(popupId)
      onClose()
    } catch {
      // Keep the modal open so the user can retry the same action.
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.card}>
            {canShowImage ? (
              <Image
                source={{ uri: normalizedImageUrl }}
                style={styles.image}
                contentFit="cover"
                onError={() => setFailedImageUrl(normalizedImageUrl)}
                accessibilityLabel={title?.trim() || '앱 이벤트 이미지'}
              />
            ) : (
              <View style={styles.fallback}>
                <Text style={styles.fallbackTitle}>{title?.trim() || 'STORIX 이벤트'}</Text>
                {content?.trim() ? (
                  <Text style={styles.fallbackContent}>{content.trim()}</Text>
                ) : null}
              </View>
            )}

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="이벤트 팝업 닫기"
              >
                <Text style={styles.closeButtonText}>닫기</Text>
              </Pressable>
              <Pressable
                onPress={onAction}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={actionLabel}
              >
                <Text style={styles.actionButtonText} numberOfLines={1}>
                  {actionLabel}
                </Text>
              </Pressable>
            </View>
          </View>

          {showDailyDismiss ? (
            <Pressable
              onPress={handleDismissForToday}
              disabled={dismissMutation.isPending}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="오늘 다시 보지 않기"
            >
              <Text style={[styles.dismissText, dismissMutation.isPending && styles.pendingText]}>
                오늘 다시 보지 않기
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(19, 17, 18, 0.60)',
  },
  content: {
    alignItems: 'center',
    gap: 20,
  },
  card: {
    width: 324,
    height: 400,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: Magenta[300],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 76,
  },
  fallbackTitle: {
    color: C.card,
    fontFamily: FontFamily.bold,
    fontSize: 30,
    lineHeight: 39,
  },
  fallbackContent: {
    marginTop: 12,
    color: C.card,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    position: 'absolute',
    right: 19,
    bottom: 18,
    left: 19,
    flexDirection: 'row',
    gap: 8,
  },
  closeButton: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: Magenta[300],
  },
  closeButtonText: {
    color: Magenta[50],
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22.4,
  },
  actionButton: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: C.card,
  },
  actionButtonText: {
    color: Magenta[300],
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22.4,
  },
  dismissText: {
    color: C.card,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 19.6,
    textDecorationLine: 'underline',
  },
  pendingText: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.9,
  },
})
