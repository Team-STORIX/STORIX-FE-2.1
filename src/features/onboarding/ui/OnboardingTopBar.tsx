import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Gray } from '../../../theme/colors'

const backIcon = require('../../../../assets/icons/common/back.svg')

export function OnboardingTopBar({
  onBack,
  onSkip,
}: {
  onBack: () => void
  onSkip?: () => void
}) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
      </Pressable>

      {onSkip ? (
        <Pressable onPress={onSkip}>
          <Text style={styles.skipText}>건너뛰기</Text>
        </Pressable>
      ) : (
        <View />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Gray[500],
    lineHeight: 20,
  },
})
