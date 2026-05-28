import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Gray } from '../../../theme'

const bigStarPink = require('../../../../assets/icons/common/big-star-pink.svg')

export function FinalStep() {
  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>준비완료!</Text>
        <Text style={styles.subtitle}>이제 탐험을 시작해볼까요?</Text>
      </View>

      <View style={styles.imageWrap}>
        <Image source={bigStarPink} style={styles.image} contentFit="contain" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  textWrap: {
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    color: C.text,
  },
  subtitle: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: Gray[500],
    textAlign: 'center',
  },
  imageWrap: {
    marginTop: 125,
    width: 180,
    height: 180,
  },
  image: {
    width: 180,
    height: 180,
  },
})
