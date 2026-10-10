import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Gray, Typography } from '../../../theme'

const warningIcon = require('../../../../assets/icons/profile/warning.svg')

export function ProfileActivityEmptyState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Image source={warningIcon} style={styles.icon} contentFit="contain" />
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 16,
  },
  icon: {
    width: 100,
    height: 100,
  },
  message: {
    marginTop: 20,
    ...Typography.heading2,
    color: Gray[900],
    textAlign: 'center',
  },
})
