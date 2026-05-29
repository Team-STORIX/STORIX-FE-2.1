import { StyleSheet, Text, View } from 'react-native'
import { FontFamily, Typography } from '../../../theme/typography';
import { C } from '../../../theme/colors'

type Stat = { label: string; value: string | number }

export function ProfileStatCard({ stats }: { stats: Stat[] }) {
  return (
    <View style={styles.card}>
      {stats.map((stat, i) => (
        <View
          key={stat.label}
          style={[styles.cell, i < stats.length - 1 && styles.cellBorder]}
        >
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginHorizontal: 20,
    marginTop: 16,
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  cellBorder: {
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  value: {
    fontSize: 22,
    ...Typography.caption1Extrabold,
    color: C.primary,
    marginBottom: 4,
  },
  label: {
    color: C.textMuted,
    fontFamily: FontFamily.medium,
  },
})
