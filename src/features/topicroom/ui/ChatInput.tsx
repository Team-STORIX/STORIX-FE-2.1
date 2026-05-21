import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray } from '../../../theme'
import { Typography } from '../../../theme/typography'

const sendIcon = require('../../../../assets/topicroom/icon-topicroom-send.svg')

type Props = {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  canSend: boolean
  isSending?: boolean
}

export function ChatInput({ value, onChangeText, onSend, canSend, isSending }: Props) {
  const insets = useSafeAreaInsets()
  const [keyboardShown, setKeyboardShown] = useState(false)

  useEffect(() => {
    // While the keyboard is up it covers the bottom safe-area (home indicator),
    // so the input must sit directly on the keyboard with no extra inset padding.
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const show = Keyboard.addListener(showEvt, () => setKeyboardShown(true))
    const hide = Keyboard.addListener(hideEvt, () => setKeyboardShown(false))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  const paddingBottom = keyboardShown ? 10 : insets.bottom + 10

  return (
    <View style={[styles.container, { paddingBottom }]}>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="메시지를 입력하세요"
          placeholderTextColor={C.textMuted}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={canSend ? onSend : undefined}
          blurOnSubmit={false}
          editable={!isSending}
        />
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.sendBtn,
          canSend ? styles.sendBtnActive : styles.sendBtnDisabled,
          pressed && canSend && styles.sendBtnPressed,
        ]}
        onPress={onSend}
        disabled={!canSend || isSending}
        accessibilityRole="button"
        accessibilityLabel="전송"
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Image source={sendIcon} style={styles.sendIcon} contentFit="contain" />
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    minHeight: 40,
    backgroundColor: C.bg,
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  input: {
    maxHeight: 96,
    ...Typography.body2Medium,
    color: C.text,
    paddingVertical: 0,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnActive: { backgroundColor: C.primary },
  sendBtnDisabled: { backgroundColor: Gray[300] },
  sendBtnPressed: { opacity: 0.75 },
  sendIcon: {
    width: 24,
    height: 24,
  },
})
