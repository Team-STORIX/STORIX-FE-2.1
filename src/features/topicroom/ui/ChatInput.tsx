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
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="메시지를 입력하세요…"
        placeholderTextColor={C.textMuted}
        multiline
        maxLength={500}
        returnKeyType="send"
        onSubmitEditing={canSend ? onSend : undefined}
        blurOnSubmit={false}
        editable={!isSending}
      />
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
            ▲
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
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: C.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 0,
  },
  sendBtnActive: { backgroundColor: C.primary },
  sendBtnDisabled: { backgroundColor: C.divider },
  sendBtnPressed: { opacity: 0.75 },
  sendIcon: { fontSize: 15, color: '#fff', fontWeight: '700' },
  sendIconDisabled: { color: C.textMuted },
})
