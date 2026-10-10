import type { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { Magenta } from '../../theme'
import { useShouldMaskAdultContent } from '../../store/adultVerification.store'
import { AdultBadge } from './AdultBadge'

type AdultThumbnailProps = {
  isAdultOnly?: boolean | null
  /** Server flag; masks on its own when present (see isAdultContentMasked). */
  isBlinded?: boolean | null
  /** Size, radius and margins of the thumbnail slot; applied to both states. */
  style?: StyleProp<ViewStyle>
  /**
   * Draws the 19 chip on the placeholder. Off where the slot is too small or
   * too busy for it, such as the popular topic room card.
   */
  showBadge?: boolean
  /** The regular thumbnail, rendered when the content is not masked. */
  children: ReactNode
}

/**
 * Swaps a work thumbnail for the adult placeholder (Figma 11288:51466):
 * a magenta/50 fill with the 19 chip pinned 6px from the top-right corner.
 */
export function AdultThumbnail({
  isAdultOnly,
  isBlinded,
  style,
  showBadge = true,
  children,
}: AdultThumbnailProps) {
  const masked = useShouldMaskAdultContent({ isAdultOnly, isBlinded })

  if (!masked) return <>{children}</>

  return (
    <View style={[styles.placeholder, style]}>
      {showBadge ? <AdultBadge size={18} style={styles.badge} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Magenta[50],
    borderRadius: 4,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
})
