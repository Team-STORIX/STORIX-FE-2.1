import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../theme/colors'
import { Radius } from '../../theme/radius'
import { S } from '../../theme/spacing'
import { Typography } from '../../theme/typography'

const tasteImage = require('../../../assets/preference/tasteImage.webp')

export function MyTasteCard() {
  return (
    <View style={styles.container}>
      <Image source={tasteImage} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      <View style={styles.overlay} />
      <Text style={styles.copy}>슥 - 넘기기만 해도 취향이 보여요</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: S.screenH,
    height: 204,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: C.divider,
    justifyContent: 'flex-end',
    padding: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  copy: {
    ...Typography.heading2,
    color: '#ffe1ed',
    maxWidth: '68%',
  },
})
