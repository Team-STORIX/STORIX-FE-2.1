import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
  Keyboard,
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

export type FeedCommentInputHandle = {
  focus: () => void
}

export const FeedCommentInput = forwardRef<FeedCommentInputHandle, Props>(
  function FeedCommentInput({ profileImageUrl, replyTargetActive, value, onChangeText, onSubmit }, ref) {
    const { bottom } = useSafeAreaInsets()
    const [navBarHeight, setNavBarHeight] = useState(0)
    const [keyboardVisible, setKeyboardVisible] = useState(() => Keyboard.isVisible())
    const [contentHeight, setContentHeight] = useState(0)
    const inputRef = useRef<TextInput>(null)
    const [autoFocusKey, setAutoFocusKey] = useState(0)
    const canSubmit = value.trim().length > 0
    const isMultiLine = contentHeight > 20

    useImperativeHandle(ref, () => ({
      focus: () => {
        setAutoFocusKey((k) => k + 1)
      },
    }))

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

          <View style={[styles.inputWrap, isMultiLine && styles.inputWrapExpanded]}>
            <TextInput
              key={autoFocusKey}
              ref={inputRef}
              autoFocus={autoFocusKey > 0}
              value={value}
              onChangeText={(text) => onChangeText(text.slice(0, MAX_LENGTH))}
              multiline
              maxLength={MAX_LENGTH}
              style={styles.input}
              placeholder={replyTargetActive ? '대댓글을 입력하세요' : '댓글을 입력하세요'}
              placeholderTextColor={Gray[300]}
              textAlignVertical="top"
              scrollEnabled={false}
              onContentSizeChange={(e) => setContentHeight(e.nativeEvent.contentSize.height)}
            />
            {value.length > 0 && (
              <Text style={styles.counter}>{value.length}/{MAX_LENGTH}</Text>
            )}
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
  },
)

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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    justifyContent: 'center',
    position: 'relative',
  },
  inputWrapExpanded: {
    justifyContent: 'flex-start',
  },
  input: {
    ...Typography.body2Medium,
    color: Gray[800],
    padding: 0,
    margin: 0,
    includeFontPadding: false,
  },
  counter: {
    position: 'absolute',
    bottom: 8,
    right: 16,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    color: '#CDC4C8',
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
