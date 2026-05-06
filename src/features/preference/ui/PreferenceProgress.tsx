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
  const filledCount =
    total <= 0
      ? 0
      : isDone
        ? 10
        : Math.round(((currentIndex + 1) / total) * 10)

  return (
    <View style={styles.row}>
      {Array.from({ length: 10 }).map((_, index) => (
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
