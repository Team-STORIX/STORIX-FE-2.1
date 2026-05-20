import { useEffect, useState } from 'react'
import {
  Keyboard,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputContentSizeChangeEventData,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Gray, Radius, Typography } from '../../../theme'

const commentBlackIcon = require('../../../../assets/icons/feed/comment-black.svg')
const commentDisabledIcon = require('../../../../assets/icons/feed/upload-comment.svg')
const defaultProfileImage = require('../../../../assets/placeholders/profile-default.png')

const MAX_LENGTH = 300

type Props = {
  profileImageUrl?: string | null
  replyTargetActive: boolean
  value: string
  onChangeText: (value: string) => void
  onSubmit: () => void
}

export function FeedCommentInput({
  profileImageUrl,
  replyTargetActive,
  value,
  onChangeText,
  onSubmit,
}: Props) {
  const { bottom } = useSafeAreaInsets()
  const [navBarHeight, setNavBarHeight] = useState(0)
  const [inputHeight, setInputHeight] = useState(20)
  const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible())
  const canSubmit = value.trim().length > 0

  useEffect(() => {
    if (bottom > 0) setNavBarHeight(bottom)
  }, [bottom])

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true)
    })
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false)
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  const handleContentSizeChange = (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) => {
    const next = Math.min(39.2, Math.max(20, event.nativeEvent.contentSize.height))
    setInputHeight(next)
  }

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.avatarWrap}>
          <Image
            source={profileImageUrl ? { uri: profileImageUrl } : defaultProfileImage}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>

        <View style={styles.inputWrap}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            multiline
            maxLength={300}
            onContentSizeChange={handleContentSizeChange}
            style={[styles.input, { height: inputHeight }]}
            placeholder={replyTargetActive ? '대댓글을 입력하세요' : '댓글을 입력하세요'}
            placeholderTextColor={Gray[300]}
          />
        </View>

        <Pressable onPress={onSubmit} disabled={!canSubmit} style={styles.submitButton}>
          <Image
            source={canSubmit ? commentBlackIcon : commentDisabledIcon}
            style={styles.submitIcon}
            contentFit="contain"
          />
        </Pressable>
      </View>
      {!keyboardVisible ? (
        <View style={{ height: navBarHeight, backgroundColor: '#ffffff' }} />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: Gray[100],
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: Gray[200],
  },
  avatar: {
    width: 36,
    height: 36,
  },
  inputWrap: {
    flex: 1,
    minHeight: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E0E0',
    backgroundColor: '#F8F7F7',
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  input: {
    flex: 1,
    ...Typography.body2Medium,
    color: Gray[800],
    paddingVertical: 0,
  },
  counter: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    color: '#CDC4C8',
    textAlign: 'right',
  },
  submitButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitIcon: {
    width: 36,
    height: 36,
  },
})
