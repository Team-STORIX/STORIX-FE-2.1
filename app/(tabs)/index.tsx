import { ActivityIndicator, StyleSheet, View, Text } from 'react-native'
import { useMe } from '../../src/hooks/profile/useMe'

// TODO(Phase home): Replace this debug screen with the real home UI.

export default function HomeScreen() {
  const { data: me, isLoading, isError, error } = useMe()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>STORIX</Text>

      {isLoading && <ActivityIndicator style={styles.loader} />}

      {me && (
        <View style={styles.card}>
          <Text style={styles.label}>userId</Text>
          <Text style={styles.value}>{me.userId}</Text>

          <Text style={styles.label}>nickName</Text>
          <Text style={styles.value}>{me.nickName}</Text>

          <Text style={styles.label}>role</Text>
          <Text style={styles.value}>{me.role}</Text>

          <Text style={styles.label}>level</Text>
          <Text style={styles.value}>{me.level}</Text>
        </View>
      )}

      {isError && (
        <Text style={styles.error}>
          Profile fetch failed:{'\n'}
          {error instanceof Error ? error.message : String(error)}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  loader: { marginTop: 16 },
  card: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 20,
    gap: 4,
  },
  label: { fontSize: 11, color: '#888', textTransform: 'uppercase', marginTop: 10 },
  value: { fontSize: 16, fontWeight: '500' },
  error: { marginTop: 16, color: '#c00', fontSize: 13, textAlign: 'center' },
})
