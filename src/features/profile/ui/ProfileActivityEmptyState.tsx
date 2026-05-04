import { StyleSheet, Text, View } from 'react-native'
import { Gray, Typography } from '../../../theme'

export function ProfileActivityEmptyState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  message: {
    ...Typography.body2Medium,
    color: Gray[400],
  },
})
