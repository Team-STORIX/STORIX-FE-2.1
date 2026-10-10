import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Gray, Typography } from '../../../theme'

const findBooksButton = require('../../../../assets/icons/profile/find-books.svg')

export function ProfileFindWorksEmptyState({
  message,
  centerText = false,
}: {
  message: string
  centerText?: boolean
}) {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text style={[styles.text, centerText && styles.centerText]}>{message}</Text>
      <Pressable
        onPress={() => router.push('/search')}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="작품 찾기"
      >
        <Image source={findBooksButton} style={styles.button} contentFit="contain" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    alignItems: 'center',
  },
  text: {
    ...Typography.heading3,
    color: Gray[500],
  },
  centerText: {
    textAlign: 'center',
  },
  button: {
    width: 131,
    height: 36,
    marginTop: 20,
  },
  pressed: {
    opacity: 0.8,
  },
})
