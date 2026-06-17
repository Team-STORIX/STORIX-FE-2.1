import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Gray, Magenta, Typography } from '../../../theme'
import { TitleInfoModal } from './TitleInfoModal'

const helpIcon = require('../../../../assets/icons/common/icon-help.svg')

export type LevelProgressProps = {
  /** 현재 단계 */
  level: string
  /** 다음 칭호명 */
  nextTitle: string
  /** 남은 포인트 (다음 단계까지) */
  remainingPoints: number
  /** 진행률 (0-1 사이의 값) */
  progress: number
  /** 대표 장르 */
  topGenre: string | null
  /** 현재 칭호 */
  title: string | null
}

export function LevelProgress({
  level,
  nextTitle,
  remainingPoints,
  progress,
  topGenre,
  title
}: LevelProgressProps) {
  const [showModal, setShowModal] = useState(false)

  // 최고 단계 달성 여부 (nextStage가 현재 stage와 같거나 비어있으면)
  const isMaxLevel = !nextTitle || nextTitle === level

  return (
    <View style={styles.container}>
      {/* 텍스트 영역 */}
      <View style={styles.textRow}>
        {isMaxLevel ? (
          <Text style={styles.levelText}>
            {level} 칭호 달성 완료
          </Text>
        ) : (
          <>
            <Text style={styles.levelText}>
              {nextTitle} 칭호까지
            </Text>
            <Text style={styles.pointsText}>{remainingPoints} 점</Text>
          </>
        )}
        <Pressable onPress={() => setShowModal(true)} hitSlop={8}>
          <Image source={helpIcon} style={styles.helpIcon} contentFit="contain" />
        </Pressable>
      </View>

      {/* 프로그레스바 */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
      </View>

      {/* 칭호 안내 모달 */}
      <TitleInfoModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        topGenre={topGenre}
        title={title}
      />
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
