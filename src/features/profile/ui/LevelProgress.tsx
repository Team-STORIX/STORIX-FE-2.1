import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Gray, Magenta, Typography } from '../../../theme'

const helpIcon = require('../../../../assets/icons/common/icon-help.svg')

export type LevelProgressProps = {
  /** 현재 단계 */
  level: string
  /** 다음 칭호명 */
  nextTitle: string
  /** 현재 포인트 */
  currentPoints: number
  /** 진행률 (0-1 사이의 값) */
  progress: number
}

export function LevelProgress({ level, nextTitle, currentPoints, progress }: LevelProgressProps) {
  return (
    <View style={styles.container}>
      {/* 텍스트 영역 */}
      <View style={styles.textRow}>
        <Text style={styles.levelText}>
          {level} {nextTitle}까지
        </Text>
        <Text style={styles.pointsText}>{currentPoints} 점</Text>
        <Image source={helpIcon} style={styles.helpIcon} contentFit="contain" />
      </View>

      {/* 프로그레스바 */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 67,
    paddingHorizontal: 16,
    paddingTop: 2,
    backgroundColor: C.card,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelText: {
    ...Typography.body2Medium,
    color: Gray[900],
    textAlign: 'center',
  },
  pointsText: {
    ...Typography.body2Bold,
    color: Magenta[300],
    textAlign: 'center',
    marginLeft: 4,
  },
  helpIcon: {
    width: 24,
    height: 24,
    marginLeft: 4,
  },
  progressBarContainer: {
    marginTop: 10,
    height: 9,
    backgroundColor: Gray[100],
    borderRadius: 4.5, // 높이의 절반으로 완전히 둥글게 (나중에 조정 가능)
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Magenta[300],
    borderRadius: 4.5,
  },
})
