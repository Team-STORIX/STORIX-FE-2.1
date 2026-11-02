import { useMemo } from 'react'
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native'
import { openExternalLink, splitLinkSegments } from '../../lib/link'
import { C } from '../../theme/colors'

type Props = {
  children?: string | null
  style?: StyleProp<TextStyle>
  /** Overrides the link appearance, e.g. on the magenta outgoing chat bubble. */
  linkStyle?: StyleProp<TextStyle>
  numberOfLines?: number
  /**
   * Links stay inert while the body is masked (spoiler, adult, blinded) so a
   * hidden link can never be tapped through its cover.
   */
  enabled?: boolean
  /** Overrides the default in-app browser hand-off. */
  onPressLink?: (url: string) => void
}

/**
 * Renders user-authored text with tappable URLs. Falls back to a plain `Text`
 * when there is nothing to link, which is the overwhelmingly common case.
 */
export function LinkedText({
  children,
  style,
  linkStyle,
  numberOfLines,
  enabled = true,
  onPressLink,
}: Props) {
  const text = children ?? ''

  const segments = useMemo(
    () => (enabled ? splitLinkSegments(text) : []),
    [enabled, text],
  )

  const linked = segments.some((segment) => segment.url != null)

  if (!linked) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    )
  }

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((segment, index) => {
        const { url } = segment
        if (url == null) return segment.text

        return (
          <Text
            key={`${index}-${url}`}
            style={[styles.link, linkStyle]}
            accessibilityRole="link"
            accessibilityLabel={`링크 열기 ${url}`}
            suppressHighlighting
            onPress={() => {
              if (onPressLink) onPressLink(url)
              else void openExternalLink(url)
            }}
          >
            {segment.text}
          </Text>
        )
      })}
    </Text>
  )
}

const styles = StyleSheet.create({
  link: {
    color: C.primary,
    textDecorationLine: 'underline',
  },
})
