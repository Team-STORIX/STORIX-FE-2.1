import { useEffect, useRef } from 'react'
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { C, Radius, S, Typography } from '../../../theme'

const cancelIcon = require('../../../../assets/icons/common/cancel.svg')
const searchIcon = require('../../../../assets/icons/common/search.svg')

type Props = {
  visible: boolean
  onClose: () => void
}

export function ReviewWriteBottomSheet({ visible, onClose }: Props) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) return

    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start()
  }, [progress, visible])

  const handleClose = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onClose()
      }
    })
  }

  if (!visible) {
    return null
  }

  return (
    <Modal transparent animationType="none" visible onRequestClose={handleClose}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [48, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>작품선택</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Image source={cancelIcon} style={styles.closeIcon} contentFit="contain" />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              value=""
              editable={false}
              placeholder="어떤 이야기를 하고 싶은 작품을 검색해주세요"
              placeholderTextColor={C.textMuted}
              style={styles.searchInput}
            />
            <Image source={searchIcon} style={styles.searchIcon} contentFit="contain" />
          </View>

          <View style={styles.body}>
            <Text style={styles.bodyTitle}>리뷰 작성 작품 검색은 준비 중입니다.</Text>
            <Text style={styles.bodyText}>
              UI-NAV-1에서는 2.0의 플러스 버튼, 팝업, 바텀시트 동작만 우선 맞췄습니다.
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    height: '80%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    backgroundColor: C.card,
    paddingHorizontal: S.screenH,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 28,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  searchWrap: {
    marginBottom: 32,
    justifyContent: 'center',
  },
  searchInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.border,
    paddingLeft: 16,
    paddingRight: 48,
    paddingVertical: 14,
    backgroundColor: C.card,
    color: C.textMuted,
    ...Typography.body2Medium,
  },
  searchIcon: {
    position: 'absolute',
    right: 16,
    width: 20,
    height: 20,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bodyTitle: {
    ...Typography.body1Semibold,
    color: C.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  bodyText: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: 'center',
  },
})
