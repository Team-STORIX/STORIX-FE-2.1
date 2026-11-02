import { StyleSheet, View } from 'react-native'
import { Magenta } from '../../../theme'

type PreferenceProgressProps = {
  total: number
  currentIndex: number
  isDone: boolean
}

export function PreferenceProgress({
  total,
  currentIndex,
  isDone,
}: PreferenceProgressProps) {
  // One segment per item — guarantees that one swipe advances exactly one
  // segment, regardless of total. Previous logic mapped `total` items onto a
  // fixed 10-segment bar with Math.round, which jumped by 2 when total != 10.
  const segmentCount = total > 0 ? total : 10
  const filledCount =
    total <= 0
      ? 0
      : isDone
        ? total
        : Math.max(0, Math.min(total, currentIndex + 1))

  return (
    <View style={styles.row}>
      {Array.from({ length: segmentCount }).map((_, index) => (
        <View
          key={`pref-progress-${index}`}
          style={[
            styles.segment,
            index < filledCount ? styles.segmentActive : styles.segmentInactive,
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
  },
  segmentActive: {
    backgroundColor: Magenta[300],
  },
  segmentInactive: {
    backgroundColor: Magenta[50],
  },
})
