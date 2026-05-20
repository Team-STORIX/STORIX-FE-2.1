import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C } from '../../../theme/colors'
import { Typography } from '../../../theme/typography'

type Props = {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  canSend: boolean
  isSending?: boolean
}

export function ChatInput({ value, onChangeText, onSend, canSend, isSending }: Props) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
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
          <Text style={[styles.sendIcon, !canSend && styles.sendIconDisabled]}>
            ↑
          </Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnActive: { backgroundColor: C.primary },
  sendBtnDisabled: { backgroundColor: C.divider },
  sendBtnPressed: { opacity: 0.75 },
  sendIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
    lineHeight: 20,
  },
  sendIconDisabled: { color: C.textMuted },
})
