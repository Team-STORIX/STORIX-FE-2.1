import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useAuthStore } from '../../../store/auth.store'
import { C, Gray } from '../../../theme'

const backIcon = require('../../../../assets/icons/common/back.svg')
const checkPink = require('../../../../assets/icons/common/check-pink.svg')
const checkGray = require('../../../../assets/icons/common/check-gray.svg')
const nextPink = require('../../../../assets/onboarding/next.svg')
const nextGray = require('../../../../assets/onboarding/next-gray.svg')

export function AgreementScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const setMarketingAgree = useAuthStore((s) => s.setMarketingAgree)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const onboardingToken = useAuthStore((s) => s.onboardingToken)
  const [agreement1, setAgreement1] = useState(false)
  const [agreement2, setAgreement2] = useState(false)
  const [agreement3, setAgreement3] = useState(false)

  const allAgreed = agreement1 && agreement2 && agreement3
  const footerBottomPadding = Platform.OS === 'android' ? insets.bottom + 34 : 34

  const handleAllAgree = () => {
    const next = !allAgreed
    setAgreement1(next)
    setAgreement2(next)
    setAgreement3(next)
  }

  const handleBack = async () => {
    if (router.canGoBack()) {
      router.back()
      return
    }

    await clearAuth()
  }

  const handleNext = async () => {
    if (!allAgreed || !onboardingToken) return
    await setMarketingAgree(true)
    router.replace('/(auth)/onboarding')
  }

  if (!onboardingToken) {
    return (
      <View style={[styles.missingScreen, { paddingTop: insets.top + 32 }]}>
        <Text style={styles.missingTitle}>회원가입 정보가 없어요.</Text>
        <Text style={styles.missingBody}>로그인 화면으로 돌아가 다시 진행해 주세요.</Text>
        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          style={styles.resetButton}
        >
          <Text style={styles.resetButtonText}>로그인으로 돌아가기</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
        </Pressable>
        <Text style={styles.topBarTitle}>약관동의</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>
          스토릭스 이용을 위해{'\n'}필수 약관에 동의해 주세요.
        </Text>

        <Pressable
          onPress={handleAllAgree}
          style={[styles.allAgreeButton, allAgreed && styles.allAgreeButtonActive]}
        >
          <Image
            source={allAgreed ? checkPink : checkGray}
            style={styles.allAgreeCheckIcon}
            contentFit="contain"
          />
          <Text style={[styles.allAgreeText, allAgreed && styles.allAgreeTextActive]}>
            전체동의
          </Text>
        </Pressable>

        <View style={styles.termsBlock}>
          <AgreementRow
            checked={agreement1}
            label="(필수) 서비스 이용약관 동의"
            onPress={() => setAgreement1((v) => !v)}
            onOpenLink={() =>
              void Linking.openURL(
                'https://truth-gopher-09e.notion.site/STORIX-2cae81f7094880c889bfd8300787572a?source=copy_link',
              )
            }
          />
          <AgreementRow
            checked={agreement2}
            label="(필수) 개인정보 수집·이용 동의"
            onPress={() => setAgreement2((v) => !v)}
            onOpenLink={() =>
              void Linking.openURL(
                'https://truth-gopher-09e.notion.site/STORIX-2cae81f709488090a7a3ff51191afd9a',
              )
            }
          />
          <AgreementAgeRow
            checked={agreement3}
            onPress={() => setAgreement3((v) => !v)}
          />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
        <Pressable onPress={handleNext} disabled={!allAgreed} style={styles.nextButtonPressable}>
          <Image
            source={allAgreed ? nextPink : nextGray}
            style={styles.nextButtonImage}
            contentFit="contain"
          />
        </Pressable>
      </View>
    </View>
  )
}

function AgreementRow({
  checked,
  label,
  onPress,
  onOpenLink,
}: {
  checked: boolean
  label: string
  onPress: () => void
  onOpenLink: () => void
}) {
  return (
    <View style={styles.termRow}>
      <Pressable onPress={onPress} style={styles.checkboxWrap}>
        <Image source={checked ? checkPink : checkGray} style={styles.checkIcon} contentFit="contain" />
      </Pressable>
      <Pressable onPress={onOpenLink}>
        <Text style={[styles.termLink, checked && styles.termLinkActive]}>{label}</Text>
      </Pressable>
    </View>
  )
}

function AgreementAgeRow({
  checked,
  onPress,
}: {
  checked: boolean
  onPress: () => void
}) {
  return (
    <View style={styles.termRow}>
      <Pressable onPress={onPress} style={styles.checkboxWrap}>
        <Image source={checked ? checkPink : checkGray} style={styles.checkIcon} contentFit="contain" />
      </Pressable>
      <Text style={[styles.termAgeText, checked && styles.termLinkActive]}>(필수) 14세 이상입니다.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
  },
  missingScreen: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    color: C.text,
  },
  missingBody: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: Gray[500],
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 20,
    width: 200,
    height: 44,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    color: C.card,
  },
  topBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  heading: {
    marginTop: 40,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    color: C.text,
  },
  allAgreeButton: {
    marginTop: 32,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Gray[300],
    backgroundColor: C.bg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  allAgreeButtonActive: {
    borderColor: C.primaryMid,
    backgroundColor: C.primaryLight,
  },
  allAgreeCheckIcon: {
    width: 24,
    height: 24,
  },
  allAgreeText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19.6,
    color: Gray[500],
  },
  allAgreeTextActive: {
    color: C.primary,
  },
  termsBlock: {
    marginTop: 20,
  },
  termRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  checkboxWrap: {
    marginRight: 6,
  },
  checkIcon: {
    width: 20,
    height: 20,
  },
  termLink: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19.6,
    color: Gray[500],
    textDecorationLine: 'underline',
  },
  termAgeText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19.6,
    color: Gray[500],
  },
  termLinkActive: {
    color: C.primary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 17,
    justifyContent: 'center',
  },
  nextButtonPressable: {
    width: '100%',
  },
  nextButtonImage: {
    width: '100%',
    height: 50,
  },
})
