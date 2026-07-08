import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Gray, Radius, Typography } from '../../../theme'

const backIcon = require('../../../../assets/icons/common/back.svg')
const searchIcon = require('../../../../assets/icons/common/search.svg')
const cancelIcon = require('../../../../assets/icons/search/icon-delete-medium.svg')

type Props = {
  value: string
  onChangeText: (value: string) => void
  onSubmit: () => void
  onBackPress: () => void
  onClearPress: () => void
  autoFocus?: boolean
}

export function LibrarySearchHeader({
  value,
  onChangeText,
  onSubmit,
  onBackPress,
  onClearPress,
  autoFocus = true,
}: Props) {
  const hasValue = value.trim().length > 0

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        onPress={onBackPress}
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
      >
        <Image source={backIcon} style={styles.leadingIcon} contentFit="contain" />
      </Pressable>

      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="내 서재 내 작품/작가를 검색해보세요"
          placeholderTextColor={C.textMuted}
          style={styles.input}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
        />

        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={hasValue ? onClearPress : onSubmit}
          accessibilityRole="button"
          accessibilityLabel={hasValue ? '검색어 지우기' : '검색'}
        >
          <Image
            source={hasValue ? cancelIcon : searchIcon}
            style={hasValue ? styles.cancelIcon : styles.searchIcon}
            contentFit="contain"
          />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    backgroundColor: C.card,
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.sm,
    backgroundColor: Gray[50],
    paddingLeft: 12,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    ...Typography.body1Medium,
    color: C.text,
    paddingVertical: 12,
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadingIcon: {
    width: 24,
    height: 24,
  },
  searchIcon: {
    width: 24,
    height: 24,
  },
  cancelIcon: {
    width: 18,
    height: 18,
  },
  pressed: {
    opacity: 0.7,
  },
})
