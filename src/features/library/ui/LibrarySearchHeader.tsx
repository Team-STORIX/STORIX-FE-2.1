import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { C, Gray, Radius, Typography } from '../../../theme'

const backIcon = require('../../../../assets/icons/common/back.svg')
const searchIcon = require('../../../../assets/icons/common/search.svg')
const cancelIcon = require('../../../../assets/icons/common/cancel.svg')

type Props = {
  value: string
  onChangeText: (value: string) => void
  onSubmit: () => void
  onBackPress: () => void
  onClearPress: () => void
}

export function LibrarySearchHeader({
  value,
  onChangeText,
  onSubmit,
  onBackPress,
  onClearPress,
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
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
        />

        <View style={styles.actions}>
          {hasValue ? (
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              onPress={onClearPress}
              accessibilityRole="button"
              accessibilityLabel="검색어 지우기"
            >
              <Image source={cancelIcon} style={styles.cancelIcon} contentFit="contain" />
            </Pressable>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            onPress={onSubmit}
            accessibilityRole="button"
            accessibilityLabel="검색"
          >
            <Image source={searchIcon} style={styles.searchIcon} contentFit="contain" />
          </Pressable>
        </View>
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
    paddingBottom: 12,
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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
    width: 12,
    height: 12,
  },
  pressed: {
    opacity: 0.7,
  },
})
