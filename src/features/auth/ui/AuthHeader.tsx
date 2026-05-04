import { StyleSheet, Text, View } from 'react-native'
import { C } from '../../../theme/colors'

type Props = { tagline?: string }

export function AuthHeader({ tagline = '웹툰과 웹소설의 이야기 공간' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>STORIX</Text>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: 4,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 14,
    color: C.textMuted,
    letterSpacing: 0.3,
  },
})
