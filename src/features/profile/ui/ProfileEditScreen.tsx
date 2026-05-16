import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { C, Gray, Typography } from '../../../theme'
import { useProfileStore } from '../store/profile.store'
import { updateProfileDescription, updateProfileNickname, uploadAndSetProfileImage } from '../api'
import { ME_QUERY_KEY, useMe } from '../hooks/useMe'
import { BioStep } from '../../onboarding/ui/BioStep'
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
  const [localProfileImageUri, setLocalProfileImageUri] = useState<string | undefined>()
  const [isUploadingImage, setIsUploadingImage] = useState(false)
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

  const handleProfileImagePress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('\uad8c\ud55c \ud544\uc694', '\uac24\ub7ec\ub9ac \uc811\uadfc \uad8c\ud55c\uc774 \ud544\uc694\ud574\uc694. \uc124\uc815\uc5d0\uc11c \ud5c8\uc6a9\ud574 \uc8fc\uc138\uc694.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    })
    if (result.canceled || !result.assets[0]) return

    const uri = result.assets[0].uri
    setLocalProfileImageUri(uri)
    setIsUploadingImage(true)
    try {
      await uploadAndSetProfileImage(uri)
      patchMe({ profileImageUrl: uri })
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
    } catch {
      Alert.alert('\uc624\ub958', '\ud504\ub85c\ud544 \uc774\ubbf8\uc9c0 \uc5c5\ub85c\ub4dc\uc5d0 \uc2e4\ud328\ud588\uc5b4\uc694.')
      setLocalProfileImageUri(undefined)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async () => {
    if (!me || !canSubmit || isSaving) return

    setIsSaving(true)

    try {
      if (nicknameChanged) {
        const response = await updateProfileNickname(nickname.trim())
        if (!response.isSuccess) {
          throw new Error(response.message || '닉네임 변경에 실패했어요.')
        }
        patchMe({ nickName: nickname.trim() })
      }

      if (bioChanged) {
        const response = await updateProfileDescription(bioText)
        if (!response.isSuccess) {
          throw new Error(response.message || '한줄소개 변경에 실패했어요.')
        }
        patchMe({ profileDescription: bioText })
      }

      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
      Alert.alert('완료', '프로필 수정이 완료되었어요.', [
        {
          text: '확인',
          onPress: () => router.replace('/(tabs)/profile'),
        },
      ])
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '프로필 수정 중 오류가 발생했어요.'
      Alert.alert('오류', message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!me) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>프로필을 불러오는 중...</Text>
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
            source={
              localProfileImageUri
                ? { uri: localProfileImageUri }
                : me.profileImageUrl
                  ? { uri: me.profileImageUrl }
                  : defaultProfileImage
            }
            style={[styles.profileImage, isUploadingImage && styles.imageUploading]}
            contentFit="cover"
          />

          <Pressable
            onPress={() => void handleProfileImagePress()}
            disabled={isUploadingImage}
            style={({ pressed }) => [styles.imageEditButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="프로필 이미지 변경"
          >
            <Image source={profileChangeIcon} style={styles.imageEditIcon} contentFit="contain" />
          </Pressable>
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.fieldLabel}>닉네임</Text>
        <View style={styles.fieldSpacer} />
        <ProfileEditNicknameField
          currentNickname={initialNickname}
          value={nickname}
          onChange={setNickname}
          onVerifiedChange={setNicknameVerified}
        />

        <View style={styles.bioSection}>
          <Text style={styles.fieldLabel}>한줄소개</Text>
          <View style={styles.fieldSpacer} />
          <BioStep value={bioText} onChange={setBioText} showHeader={false} />
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
  imageUploading: {
    opacity: 0.5,
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
