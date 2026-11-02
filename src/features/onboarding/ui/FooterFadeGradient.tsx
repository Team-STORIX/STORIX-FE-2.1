import { StyleSheet, View } from 'react-native'
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg'
import { C } from '../../../theme'

type FooterFadeGradientProps = {
  height: number
  /** 같은 화면에 그라데이션이 둘 이상이면 서로 다른 id 를 준다. */
  gradientId?: string
}

/** 하단 고정 버튼 뒤로 콘텐츠가 자연스럽게 사라지도록 까는 흰색 페이드 */
export function FooterFadeGradient({ height, gradientId = 'footerFade' }: FooterFadeGradientProps) {
  return (
    <View pointerEvents="none" style={[styles.gradient, { height }]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.card} stopOpacity="0" />
            <Stop offset="0.4257" stopColor={C.card} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
})
