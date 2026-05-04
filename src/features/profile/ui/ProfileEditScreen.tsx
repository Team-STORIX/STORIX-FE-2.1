import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { C, Gray, Typography } from '../../../theme'
import { useProfileStore } from '../store/profile.store'
import { updateProfileDescription, updateProfileNickname } from '../api'
import { ME_QUERY_KEY, useMe } from '../hooks/useMe'
import { ProfileEditBioField } from './ProfileEditBioField'
import { ProfileEditNicknameField } from './ProfileEditNicknameField'
import { ProfileEditTopBar } from './ProfileEditTopBar'

const defaultProfileImage = require('../../../../assets/placeholders/profile-default.svg')
const profileChangeIcon = require('../../../../assets/icons/profile/profile-change.svg')

export function ProfileEditScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const patchMe = useProfileStore((state) => state.patchMe)
  const storedMe = useProfileStore((state) => state.me)
  const { data: meData } = useMe()
  const me = meData ?? storedMe

  const [nickname, setNickname] = useState('')
  const [bioText, setBioText] = useState('')
  const [initialNickname, setInitialNickname] = useState('')
  const [initialBioText, setInitialBioText] = useState('')
  const [nicknameVerified, setNicknameVerified] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const initRef = useRef(false)

  useEffect(() => {
    if (!me || initRef.current) return
    initRef.current = true
    const nextNickname = me.nickName ?? ''
    const nextBio = me.profileDescription ?? ''
    setNickname(nextNickname)
    setInitialNickname(nextNickname)
    setBioText(nextBio)
    setInitialBioText(nextBio)
    setNicknameVerified(true)
  }, [me])

  const nicknameChanged = nickname !== initialNickname
  const bioChanged = bioText !== initialBioText

  const canSubmit = useMemo(() => {
    if (!nickname.trim()) return false
    if (!nicknameVerified) return false
    return nicknameChanged || bioChanged
  }, [bioChanged, nickname, nicknameChanged, nicknameVerified])

  const handleBack = () => {
    if ('canGoBack' in router && router.canGoBack()) {
      router.back()
      return
    }
    router.replace('/(tabs)/profile')
  }

  const handleProfileImagePress = () => {
    Alert.alert(
      '\uc548\ub0b4',
      '\ud504\ub85c\ud544 \uc774\ubbf8\uc9c0 \uc5c5\ub85c\ub4dc\ub294 \ub124\uc774\ud2f0\ube0c \uc5f0\ub3d9 \uc900\ube44 \uc911\uc774\uc5d0\uc694.',
    )
  }

  const handleSubmit = async () => {
    if (!me || !canSubmit || isSaving) return

    setIsSaving(true)

    try {
      if (nicknameChanged) {
        const response = await updateProfileNickname(nickname.trim())
        if (!response.isSuccess) {
          throw new Error(response.message || '\ub2c9\ub124\uc784 \ubcc0\uacbd\uc5d0 \uc2e4\ud328\ud588\uc5b4\uc694.')
        }
        patchMe({ nickName: nickname.trim() })
      }

      if (bioChanged) {
        const response = await updateProfileDescription(bioText)
        if (!response.isSuccess) {
          throw new Error(
            response.message || '\ud55c\uc904\uc18c\uac1c \ubcc0\uacbd\uc5d0 \uc2e4\ud328\ud588\uc5b4\uc694.',
          )
        }
        patchMe({ profileDescription: bioText })
      }

      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
      Alert.alert('\uc644\ub8cc', '\ud504\ub85c\ud544 \uc218\uc815\uc774 \uc644\ub8cc\ub418\uc5c8\uc5b4\uc694.', [
        {
          text: '\ud655\uc778',
          onPress: () => router.replace('/(tabs)/profile'),
        },
      ])
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '\ud504\ub85c\ud544 \uc218\uc815 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc5b4\uc694.'
      Alert.alert('\uc624\ub958', message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!me) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{'\ud504\ub85c\ud544\uc744 \ubd88\ub7ec\uc624\ub294 \uc911...'}</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      <ProfileEditTopBar
        canSubmit={canSubmit}
        isSaving={isSaving}
        onBack={handleBack}
        onSubmit={() => void handleSubmit()}
      />

      <View style={styles.imageSection}>
        <View style={styles.imageFrame}>
          <Image
            source={me.profileImageUrl ? { uri: me.profileImageUrl } : defaultProfileImage}
            style={styles.profileImage}
            contentFit="cover"
          />

          <Pressable
            onPress={handleProfileImagePress}
            style={({ pressed }) => [styles.imageEditButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={'\ud504\ub85c\ud544 \uc774\ubbf8\uc9c0 \ubcc0\uacbd'}
          >
            <Image source={profileChangeIcon} style={styles.imageEditIcon} contentFit="contain" />
          </Pressable>
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.fieldLabel}>{'\ub2c9\ub124\uc784'}</Text>
        <View style={styles.fieldSpacer} />
        <ProfileEditNicknameField
          currentNickname={initialNickname}
          value={nickname}
          onChange={setNickname}
          onVerifiedChange={setNicknameVerified}
        />

        <View style={styles.bioSection}>
          <Text style={styles.fieldLabel}>{'\ud55c\uc904\uc18c\uac1c'}</Text>
          <View style={styles.fieldSpacer} />
          <ProfileEditBioField value={bioText} onChange={setBioText} />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  loadingText: {
    ...Typography.body1Medium,
    color: Gray[500],
  },
  imageSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  imageFrame: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Gray[200],
    backgroundColor: C.card,
  },
  imageEditButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
  },
  imageEditIcon: {
    width: 32,
    height: 32,
  },
  formSection: {
    marginTop: 48,
    paddingHorizontal: 16,
  },
  fieldLabel: {
    ...Typography.body2Medium,
    color: Gray[500],
  },
  fieldSpacer: {
    height: 12,
  },
  bioSection: {
    marginTop: 40,
  },
  pressed: {
    opacity: 0.8,
  },
})
