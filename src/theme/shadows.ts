import { Platform } from 'react-native'
import type { ViewStyle } from 'react-native'

// React Native shadow is platform-split (iOS uses shadow*, Android uses elevation).
// These match Tailwind's shadow-sm / shadow / shadow-md levels used in 2.0.

function shadow(
  elevation: number,
  color = '#000',
  opacity: number,
  radius: number,
  offsetY: number,
): ViewStyle {
  if (Platform.OS === 'android') {
    return { elevation }
  }
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: offsetY },
  }
}

export const Shadow = {
  none: {} as ViewStyle,
  sm:   shadow(1, '#000', 0.05, 2,  1),  // tailwind shadow-sm
  md:   shadow(3, '#000', 0.08, 6,  2),  // tailwind shadow
  lg:   shadow(6, '#000', 0.10, 12, 4),  // tailwind shadow-md
} as const
