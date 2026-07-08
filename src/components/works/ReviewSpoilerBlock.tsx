import { useEffect, useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { C } from '../../theme/colors'
import { Typography } from '../../theme/typography'

export const DEFAULT_REVIEW_SPOILER_TEXT = '스포일러가 포함된 리뷰 보기'

type Props = {
  isSpoiler: boolean
  spoilerScript?: string | null
  content: string
  defaultSpoilerText?: string
  allowReveal?: boolean
  numberOfLines?: number
  backgroundColor?: string
  textStyle?: StyleProp<TextStyle>
  spoilerTextStyle?: StyleProp<TextStyle>
  overlayStyle?: StyleProp<ViewStyle>
}

export function ReviewSpoilerBlock({
  isSpoiler,
  spoilerScript,
  content,
  defaultSpoilerText = DEFAULT_REVIEW_SPOILER_TEXT,
  allowReveal = true,
  numberOfLines,
  backgroundColor = C.card,
  textStyle,
  spoilerTextStyle,
  overlayStyle,
}: Props) {
  const spoilerText = useMemo(() => {
    const customText = spoilerScript?.trim()
    return customText && customText.length > 0 ? customText : defaultSpoilerText
  }, [defaultSpoilerText, spoilerScript])

  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setRevealed(false)
  }, [content, isSpoiler, spoilerText])

  if (!isSpoiler || revealed) {
    return (
      <Text style={textStyle} numberOfLines={numberOfLines}>
        {content}
      </Text>
    )
  }

  const SpoilerContainer = allowReveal ? Pressable : View
  const spoilerContainerProps = allowReveal
    ? {
        onPress: () => setRevealed(true),
        accessibilityRole: 'button' as const,
        accessibilityLabel: '스포일러 리뷰 내용 보기',
      }
    : {
        accessibilityRole: 'text' as const,
        accessibilityLabel: spoilerText,
      }

  return (
    <SpoilerContainer
      {...spoilerContainerProps}
      style={[styles.spoilerContainer, { backgroundColor }, overlayStyle]}
    >
      <Text style={[styles.spoilerText, spoilerTextStyle]}>{spoilerText}</Text>
    </SpoilerContainer>
  )
}

const styles = StyleSheet.create({
  spoilerContainer: {
    minHeight: 42,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingVertical: 2,
  },
  spoilerText: {
    ...Typography.body2Bold,
    color: C.primary,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
})
