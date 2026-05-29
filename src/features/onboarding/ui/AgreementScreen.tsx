import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useAuthStore } from '../../../store/auth.store'
import { C, Gray, Magenta, Radius, Typography } from '../../../theme'

const backIcon = require('../../../../assets/icons/common/back.svg')
const checkPink = require('../../../../assets/icons/common/check-pink.svg')
const checkGray = require('../../../../assets/icons/common/check-gray.svg')

export function AgreementScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const setTermsAgree = useAuthStore((s) => s.setTermsAgree)
  const onboardingToken = useAuthStore((s) => s.onboardingToken)
  const [agreement1, setAgreement1] = useState(false)
  const [agreement2, setAgreement2] = useState(false)
  const [agreement3, setAgreement3] = useState(false)

  const allAgreed = agreement1 && agreement2 && agreement3
  const footerBottomPadding = Platform.OS === 'android' ? insets.bottom + 24 : 24

  const handleAllAgree = () => {
    const next = !allAgreed
    setAgreement1(next)
    setAgreement2(next)
    setAgreement3(next)
  }

  const handleNext = async () => {
    if (!allAgreed || !onboardingToken) return
    await setTermsAgree(true)
    router.replace('/(auth)/onboarding')
  }

  if (!onboardingToken) {
    return (
      <View style={[styles.missingScreen, { paddingTop: insets.top + 32 }]}>
        <Text style={styles.missingTitle}>회원가입 정보가 없어요.</Text>
        <Text style={styles.missingBody}>로그인 화면으로 돌아가 다시 진행해 주세요.</Text>
        <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>로그인으로 돌아가기</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconWrap}>
          <Image source={backIcon} style={styles.backIcon} contentFit="contain" />
        </Pressable>
        <Text style={styles.topBarTitle}>약관동의</Text>
        <View style={styles.iconWrap} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.heading}>
          {'스토릭스 이용을 위해\n필수 약관에 동의해주세요.'}
        </Text>

        {/* 전체동의 카드 */}
        <Pressable
          onPress={handleAllAgree}
          style={[styles.allAgreeCard, allAgreed ? styles.allAgreeCardActive : styles.allAgreeCardInactive]}
        >
          <Image
            source={allAgreed ? checkPink : checkGray}
            style={styles.checkIcon}
            contentFit="contain"
          />
          <Text style={[styles.allAgreeText, allAgreed ? styles.allAgreeTextActive : styles.allAgreeTextInactive]}>
            전체동의
          </Text>
        </Pressable>

        {/* 개별 약관 목록 */}
        <View style={styles.termsBlock}>
          <AgreementRow
            checked={agreement1}
            label="(필수) 서비스 이용약관 동의"
            onToggle={() => setAgreement1((v) => !v)}
            onOpenLink={() =>
              void Linking.openURL(
                'https://truth-gopher-09e.notion.site/STORIX-2cae81f7094880c889bfd8300787572a?source=copy_link',
              )
            }
          />
          <AgreementRow
            checked={agreement2}
            label="(필수) 개인정보 수집·이용 동의"
            onToggle={() => setAgreement2((v) => !v)}
            onOpenLink={() =>
              void Linking.openURL(
                'https://truth-gopher-09e.notion.site/STORIX-2cae81f709488090a7a3ff51191afd9a',
              )
            }
          />
          <AgreementAgeRow checked={agreement3} onToggle={() => setAgreement3((v) => !v)} />
        </View>
      </View>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
        <Pressable
          onPress={handleNext}
          disabled={!allAgreed}
          style={[styles.ctaButton, allAgreed ? styles.ctaActive : styles.ctaDisabled]}
        >
          <Text style={[styles.ctaText, allAgreed ? styles.ctaTextActive : styles.ctaTextDisabled]}>
            다음으로
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

function AgreementRow({
  checked,
  label,
  onToggle,
  onOpenLink,
}: {
  checked: boolean
  label: string
  onToggle: () => void
  onOpenLink: () => void
}) {
  return (
    <View style={styles.termRow}>
      <Pressable onPress={onToggle} hitSlop={8}>
        <Image
          source={checked ? checkPink : checkGray}
          style={styles.termCheckIcon}
          contentFit="contain"
        />
      </Pressable>
      <Pressable onPress={onOpenLink} style={styles.termTextWrap}>
        <Text style={[styles.termLinkText, checked ? styles.termTextActive : styles.termTextInactive]}>
          {label}
        </Text>
      </Pressable>
    </View>
  )
}

function AgreementAgeRow({
  checked,
  onToggle,
}: {
  checked: boolean
  onToggle: () => void
}) {
  return (
    <Pressable onPress={onToggle} style={styles.termRow}>
      <Image
        source={checked ? checkPink : checkGray}
        style={styles.termCheckIcon}
        contentFit="contain"
      />
      <Text style={[styles.termPlainText, checked ? styles.termTextActive : styles.termTextInactive]}>
        (필수) 14세 이상입니다.
      </Text>
    </Pressable>
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
    ...Typography.heading1,
    color: C.text,
  },
  missingBody: {
    marginTop: 8,
    ...Typography.body1Medium,
    color: Gray[500],
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 20,
    width: 200,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    ...Typography.body1Bold,
    color: C.card,
  },
  topBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
  },
  iconWrap: {
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
    ...Typography.body1Medium,
    color: C.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  heading: {
    marginTop: 40,
    ...Typography.heading1,
    lineHeight: 34,
    color: C.text,
  },
  allAgreeCard: {
    marginTop: 32,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: Radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  allAgreeCardInactive: {
    borderColor: Gray[300],
    backgroundColor: C.bg,
  },
  allAgreeCardActive: {
    borderColor: Magenta[100],
    backgroundColor: Magenta[20],
  },
  checkIcon: {
    width: 24,
    height: 24,
  },
  allAgreeText: {
    ...Typography.body2Bold,
  },
  allAgreeTextInactive: {
    color: Gray[500],
  },
  allAgreeTextActive: {
    color: Magenta[300],
  },
  termsBlock: {
    marginTop: 8,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 6,
  },
  termTextWrap: {
    flex: 1,
  },
  termCheckIcon: {
    width: 20,
    height: 20,
  },
  termLinkText: {
    ...Typography.body2Medium,
    textDecorationLine: 'underline',
  },
  termPlainText: {
    ...Typography.body2Medium,
  },
  termTextInactive: {
    color: Gray[500],
  },
  termTextActive: {
    color: Magenta[300],
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  ctaButton: {
    height: 50,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaActive: {
    backgroundColor: C.text,
  },
  ctaDisabled: {
    backgroundColor: Gray[200],
  },
  ctaText: {
    ...Typography.body1Medium,
  },
  ctaTextActive: {
    color: C.card,
  },
  ctaTextDisabled: {
    color: Gray[500],
  },
})
