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

  const paddingBottom = keyboardShown ? 16 : insets.bottom + 16

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
          <ActivityIndicator size="small" color={C.card} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: Gray[100],
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    minHeight: 40,
    backgroundColor: Gray[50],
    borderWidth: 1,
    borderColor: Gray[200],
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    maxHeight: 96,
    ...Typography.body1Medium,
    color: Gray[900],
    paddingVertical: 0,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnActive: { backgroundColor: Gray[900] },
  sendBtnDisabled: { backgroundColor: Gray[200] },
  sendBtnPressed: { opacity: 0.75 },
  sendIcon: {
    width: 24,
    height: 24,
  },
})
