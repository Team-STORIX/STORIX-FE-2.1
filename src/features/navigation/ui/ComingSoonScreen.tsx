import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Radius, S, Typography } from '../../../theme'

type Props = {
  title: string
  description: string
}

export function ComingSoonScreen({ title, description }: Props) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>준비 중</Text>
          <Text style={styles.cardBody}>{description}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: S.screenH,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
    marginBottom: 20,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  cardTitle: {
    ...Typography.body1Semibold,
    color: C.text,
    marginBottom: 6,
  },
  cardBody: {
    ...Typography.body2Medium,
    color: C.textMuted,
  },
})
