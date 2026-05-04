import { useEffect, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray } from '../../../theme/colors'
import { Radius } from '../../../theme/radius'
import { Shadow } from '../../../theme/shadows'
import { Typography } from '../../../theme/typography'

const activeIcon = require('../../../../assets/icons/common/active.svg')
const inactiveIcon = require('../../../../assets/icons/common/deactive.svg')
const checkPinkIcon = require('../../../../assets/icons/common/check-pink.svg')
const checkGrayIcon = require('../../../../assets/icons/common/check-gray.svg')

type Option = {
  value: string
  label: string
}

type Props = {
  visible: boolean
  title: string
  options: Option[]
  value: string[]
  multiple?: boolean
  onClose: () => void
  onApply: (value: string[]) => void
}

export function SearchOptionSheet({
  visible,
  title,
  options,
  value,
  multiple = false,
  onClose,
  onApply,
}: Props) {
  const insets = useSafeAreaInsets()
  const [draft, setDraft] = useState<string[]>(value)

  useEffect(() => {
    if (visible) {
      setDraft(value)
    }
  }, [value, visible])

  const handleToggle = (optionValue: string) => {
    if (multiple) {
      setDraft((prev) =>
        prev.includes(optionValue)
          ? prev.filter((item) => item !== optionValue)
          : prev.concat(optionValue),
      )
      return
    }

    setDraft([optionValue])
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="시트 닫기"
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.title}>{title}</Text>

          <ScrollView
            style={styles.optionsScroll}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}
          >
            {options.map((option) => {
              const selected = draft.includes(option.value)
              const iconSource = multiple
                ? selected
                  ? checkPinkIcon
                  : checkGrayIcon
                : selected
                  ? activeIcon
                  : inactiveIcon

              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleToggle(option.value)}
                  accessibilityRole="button"
                  accessibilityState={selected ? { selected: true } : {}}
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Image source={iconSource} style={styles.optionIcon} contentFit="contain" />
                </Pressable>
              )
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
              onPress={() => setDraft([])}
              accessibilityRole="button"
            >
              <Text style={styles.resetLabel}>초기화</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.footerButton,
                styles.applyButton,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                onApply(draft)
                onClose()
              }}
              accessibilityRole="button"
            >
              <Text style={styles.applyLabel}>적용하기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    backgroundColor: C.card,
    paddingTop: 20,
    paddingHorizontal: 20,
    ...Shadow.lg,
  },
  title: {
    ...Typography.heading4,
    color: C.text,
    marginBottom: 16,
  },
  optionsScroll: {
    maxHeight: 360,
  },
  optionsContent: {
    paddingBottom: 8,
  },
  optionRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  optionLabel: {
    ...Typography.body1Medium,
    color: C.text,
  },
  optionIcon: {
    width: 24,
    height: 24,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  footerButton: {
    flex: 1,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Gray[100],
  },
  applyButton: {
    backgroundColor: C.primary,
  },
  resetLabel: {
    ...Typography.body1Semibold,
    color: C.textSecondary,
  },
  applyLabel: {
    ...Typography.body1Semibold,
    color: C.card,
  },
  pressed: {
    opacity: 0.75,
  },
})
