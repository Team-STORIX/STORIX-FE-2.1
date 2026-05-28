import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray } from '../../../theme'

const backIcon = require('../../../../assets/icons/common/back.svg')
const arrowDownIcon = require('../../../../assets/icons/common/arrow-down.svg')
const arrowUpIcon = require('../../../../assets/icons/common/arrow-up.svg')

type PolicyVersion = {
  id: number
  label: string
  content: string
}

const VERSIONS: PolicyVersion[] = [
  {
    id: 1,
    label: '버전 1 (25.01.01)',
    content:
      '버전1 상세 서비스 이용약관 버전1 상세 서비스 이용약관 버전1 상세 서비스 이용약관 버전1 상세 서비스 이용약관 버전1 상세 서비스 이용약관 버전1 상세 서비스 이용약관 버전1 상세 서비스 이용약관 버전1 상세 서비스 이용약관 ',
  },
  {
    id: 2,
    label: '버전 2 (25.06.01)',
    content:
      '버전2 상세 서비스 이용약관 버전2 상세 서비스 이용약관 버전2 상세 서비스 이용약관 버전2 상세 서비스 이용약관 버전2 상세 서비스 이용약관 버전2 상세 서비스 이용약관 버전2 상세 서비스 이용약관 버전2 상세 서비스 이용약관 ',
  },
]

const VERSIONS_DESC = [...VERSIONS].reverse()

export function ProfileTermsOfServiceScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [selectedId, setSelectedId] = useState(VERSIONS[VERSIONS.length - 1].id)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownTop, setDropdownTop] = useState(0)

  const selectedVersion = VERSIONS.find((v) => v.id === selectedId) ?? VERSIONS[VERSIONS.length - 1]

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View style={[styles.topBarOuter, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarInner}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
          >
            <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
          </Pressable>
          <Text style={styles.topBarTitle}>서비스 이용약관</Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>서비스 이용약관</Text>
      </View>

      {/* Version row - onLayout으로 드롭다운 위치 계산 */}
      <Pressable
        style={styles.versionRow}
        onPress={() => setDropdownOpen((v) => !v)}
        onLayout={(e) => {
          const { y, height } = e.nativeEvent.layout
          setDropdownTop(y + height)
        }}
        accessibilityRole="button"
      >
        <Text style={styles.versionLabel}>{selectedVersion.label}</Text>
        <Image
          source={dropdownOpen ? arrowUpIcon : arrowDownIcon}
          style={styles.arrowIcon}
          contentFit="contain"
        />
      </Pressable>

      {/* 약관 본문 */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentSection}>
          <Text style={styles.contentText}>{selectedVersion.content}</Text>
        </View>
      </ScrollView>

      {/* 드롭다운 + 백드롭 - screen 최상위에 렌더링, z-index 없이 렌더 순서로 처리 */}
      {dropdownOpen && (
        <>
          {/* 백드롭: 먼저 렌더 → 아래 레이어 */}
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setDropdownOpen(false)}
          />
          {/* 드롭다운 카드: 나중에 렌더 → 위 레이어, 터치 수신 가능 */}
          <View style={[styles.dropdown, { top: dropdownTop + 8 }]}>
            {VERSIONS_DESC.map((v, index) => (
              <View key={v.id}>
                {index > 0 && (
                  <View style={styles.dropdownDividerWrap}>
                    <View style={styles.dropdownDivider} />
                  </View>
                )}
                <Pressable
                  onPress={() => { setSelectedId(v.id); setDropdownOpen(false) }}
                  style={({ pressed }) => pressed && styles.pressed}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.dropdownItem,
                      v.id === selectedId && styles.dropdownItemSelected,
                    ]}
                  >
                    {v.label}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  topBarOuter: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: C.card,
  },
  topBarInner: {
    position: 'relative',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: C.text,
  },
  headerBox: {
    padding: 20,
    paddingBottom: 12,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'SUIT',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25.2,
    color: C.text,
    textAlign: 'left',
  },
  versionRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  versionLabel: {
    fontFamily: 'SUIT',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: C.textSecondary,
  },
  arrowIcon: {
    width: 24,
    height: 24,
  },
  dropdown: {
    position: 'absolute',
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: C.card,
    shadowColor: C.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  dropdownDividerWrap: {
    marginVertical: 12,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: C.divider,
  },
  dropdownItem: {
    fontFamily: 'SUIT',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19.6,
    color: Gray[400],
  },
  dropdownItemSelected: {
    fontWeight: '700',
    color: C.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentText: {
    fontFamily: 'SUIT',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19.6,
    color: C.text,
  },
  pressed: {
    opacity: 0.7,
  },
})
