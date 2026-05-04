import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { C } from '../../../theme/colors'
import { Radius } from '../../../theme/radius'
import { S } from '../../../theme/spacing'
import { Typography } from '../../../theme/typography'

const backIcon = require('../../../../assets/icons/common/back.svg')
const searchIcon = require('../../../../assets/icons/common/search.svg')

type Props = {
  topInset: number
  value: string
  onChangeText: (text: string) => void
  onBackPress: () => void
}

export function TopicRoomSearchBar({
  topInset,
  value,
  onChangeText,
  onBackPress,
}: Props) {
  return (
    <View style={[styles.wrap, { paddingTop: topInset + 22 }]}>
      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={onBackPress}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Image source={backIcon} style={styles.icon24} contentFit="contain" />
        </Pressable>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder="토픽룸을 검색해요"
            placeholderTextColor={C.textMuted}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Pressable
            style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}
            onPress={() => undefined}
            accessibilityRole="button"
            accessibilityLabel="검색"
          >
            <Image source={searchIcon} style={styles.icon24} contentFit="contain" />
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingHorizontal: S.screenH,
    backgroundColor: C.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    minHeight: 48,
    backgroundColor: C.bg,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    ...Typography.body1Medium,
    color: C.text,
    paddingVertical: 12,
  },
  searchButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon24: {
    width: 24,
    height: 24,
  },
  pressed: {
    opacity: 0.7,
  },
})
