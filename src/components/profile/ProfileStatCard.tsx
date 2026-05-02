import { StyleSheet, Text, View } from 'react-native'
import { C } from '../../theme/colors'

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
    fontWeight: '800',
    color: C.primary,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '500',
  },
})
