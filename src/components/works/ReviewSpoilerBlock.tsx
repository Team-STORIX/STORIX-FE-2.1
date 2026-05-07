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

export const DEFAULT_REVIEW_SPOILER_TEXT = '스포일러가 포함된 리뷰입니다.'

type Props = {
  isSpoiler: boolean
  spoilerScript?: string | null
  content: string
  defaultSpoilerText?: string
  allowReveal?: boolean
  numberOfLines?: number
  backgroundColor?: string
  textStyle?: StyleProp<TextStyle>
  hiddenTextStyle?: StyleProp<TextStyle>
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
  hiddenTextStyle,
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

  return (
    <View style={styles.wrapper}>
      <Text
        style={[textStyle, styles.hiddenContent, hiddenTextStyle]}
        numberOfLines={numberOfLines}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {content}
      </Text>

      {allowReveal ? (
        <Pressable
          style={[
            styles.overlay,
            { backgroundColor },
            overlayStyle,
          ]}
          onPress={() => setRevealed(true)}
          accessibilityRole="button"
          accessibilityLabel="스포일러 리뷰 내용 보기"
        >
          <Text
            style={[styles.spoilerText, spoilerTextStyle]}
            numberOfLines={numberOfLines ?? 2}
          >
            {spoilerText}
          </Text>
        </Pressable>
      ) : (
        <View
          style={[
            styles.overlay,
            { backgroundColor },
            overlayStyle,
          ]}
          accessibilityRole="text"
          accessibilityLabel={spoilerText}
        >
          <Text
            style={[styles.spoilerText, spoilerTextStyle]}
            numberOfLines={numberOfLines ?? 2}
          >
            {spoilerText}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    minHeight: 24,
  },
  hiddenContent: {
    opacity: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  spoilerText: {
    ...Typography.caption1Medium,
    color: C.primary,
    textAlign: 'center',
  },
})
