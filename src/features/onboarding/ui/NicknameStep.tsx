import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { C, Gray, Radius, Typography } from '../../../theme'
import { checkOnboardingNickname, isNicknameCheckError } from '../../auth/lib/nickname-check'
import type { NicknameState } from '../hooks/useOnboardingForm'
import { OnboardingStepHeader } from './OnboardingStepHeader'

const profileChangeIcon = require('../../../../assets/icons/profile/profile-change.svg')
const nicknameCheckActive = require('../../../../assets/onboarding/id-check-pink.svg')
const nicknameCheckInactive = require('../../../../assets/onboarding/id-check-gray.svg')

type NicknameStepProps = {
  nickname: NicknameState
  onNicknameChange: (patch: Partial<NicknameState>) => void
  profileImageUri?: string
  onProfileImageChange: (uri: string) => void
}

export function NicknameStep({
  nickname,
  onNicknameChange,
  profileImageUri,
  onProfileImageChange,
}: NicknameStepProps) {
  const { value, status, message } = nickname
  const canCheckNickname = value.length > 0

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요해요. 설정에서 허용해 주세요.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      onProfileImageChange(result.assets[0].uri)
    }
  }

  const handleChangeText = (text: string) => {
    onNicknameChange({ value: text, verified: false, status: 'idle', message: '' })
  }

  const handleCheck = async () => {
    const result = await checkOnboardingNickname(value)
    onNicknameChange({ ...result, verified: result.status === 'ok' })
  }

  const inputBorderColor =
    status === 'ok'
      ? C.activeDot
      : isNicknameCheckError(status)
        ? C.error
        : value.length > 0
          ? C.text
          : Gray[300]

  return (
    <View>
      <OnboardingStepHeader title="프로필을 설정해주세요" subtitle="닉네임과 프로필 사진을 정해주세요" />

      {/* 프로필 사진 */}
      <View style={styles.profileWrap}>
        <View style={styles.profileImageWrap}>
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.profileImage} contentFit="cover" />
          ) : (
            <View style={styles.profilePlaceholder} />
          )}
          <Pressable style={styles.cameraButton} onPress={() => void handlePickImage()}>
            <Image source={profileChangeIcon} style={styles.cameraIcon} contentFit="contain" />
          </Pressable>
        </View>
      </View>

      {/* 닉네임 입력 */}
      <View style={styles.inputSection}>
        <View style={styles.inputRow}>
          <TextInput
            value={value}
            onChangeText={handleChangeText}
            placeholder="닉네임을 입력하세요"
            placeholderTextColor={Gray[300]}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { borderBottomColor: inputBorderColor }]}
          />

          <Pressable
            onPress={() => void handleCheck()}
            disabled={!canCheckNickname}
            style={({ pressed }) => [pressed && canCheckNickname && styles.pressed]}
          >
            <Image
              source={canCheckNickname ? nicknameCheckActive : nicknameCheckInactive}
              style={styles.checkButton}
              contentFit="contain"
            />
          </Pressable>
        </View>

        {message ? (
          <Text style={[styles.message, status === 'ok' ? styles.messageOk : styles.messageError]}>
            {message}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  profileWrap: {
    marginTop: 42,
    alignItems: 'center',
  },
  profileImageWrap: {
    width: 100,
    height: 100,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: Radius.full,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: Radius.full,
    backgroundColor: Gray[200],
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
  },
  cameraIcon: {
    width: 32,
    height: 32,
  },
  inputSection: {
    marginTop: 36,
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  input: {
    flex: 1,
    paddingTop: 10,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 8,
    borderBottomWidth: 2,
    ...Typography.body1Medium,
    color: C.text,
  },
  checkButton: {
    width: 102,
    height: 38,
  },
  message: {
    marginTop: 6,
    paddingHorizontal: 8,
    ...Typography.caption1Medium,
  },
  messageOk: {
    color: C.activeDot,
  },
  messageError: {
    color: C.error,
  },
  pressed: {
    opacity: 0.8,
  },
})
