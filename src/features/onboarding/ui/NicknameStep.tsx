import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { C, Gray , Typography } from '../../../theme'
import type { Dispatch, SetStateAction } from 'react'
import {
  checkNicknameValid,
  extractIsAvailableFromValidResponse,
  extractIsDuplicatedFromValidResponse,
  extractIsForbiddenFromValidResponse,
} from '../../auth/api/nickname.api'

const profilePhoto = require('../../../../assets/onboarding/profilephoto.svg')
const profileChange = require('../../../../assets/icons/profile/profile-change.svg')
const idCheckPink = require('../../../../assets/onboarding/id-check-pink.svg')
const idCheckGray = require('../../../../assets/onboarding/id-check-gray.svg')

type Status = 'idle' | 'ok' | 'taken' | 'invalid' | 'forbidden'

const NICKNAME_RULE_MESSAGE = '한글,영문,숫자 2~10자까지 입력 가능해요'
const NICKNAME_PATTERN = /^[가-힣A-Za-z0-9]+$/

const isValidNicknameFormat = (nickname: string) =>
  nickname.length >= 2 && nickname.length <= 10 && NICKNAME_PATTERN.test(nickname)

export function NicknameStep({
  value,
  onChange,
  onVerifiedChange,
  status,
  onStatusChange,
  message,
  onMessageChange,
  profileImageUri,
  onProfileImageChange,
}: {
  value: string
  onChange: (value: string) => void
  verified: boolean
  onVerifiedChange: Dispatch<SetStateAction<boolean>>
  status: Status
  onStatusChange: Dispatch<SetStateAction<Status>>
  message: string
  onMessageChange: Dispatch<SetStateAction<string>>
  profileImageUri?: string
  onProfileImageChange: (uri: string) => void
}) {
  const normalized = value.trim()

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

  const handleCheck = async () => {
    if (!isValidNicknameFormat(normalized)) {
      onVerifiedChange(false)
      onStatusChange('invalid')
      onMessageChange(NICKNAME_RULE_MESSAGE)
      return
    }

    try {
      const response = await checkNicknameValid(normalized)
      if (extractIsAvailableFromValidResponse(response)) {
        onVerifiedChange(true)
        onStatusChange('ok')
        onMessageChange('사용 가능한 닉네임이에요')
        return
      }
      if (extractIsDuplicatedFromValidResponse(response)) {
        onVerifiedChange(false)
        onStatusChange('taken')
        onMessageChange('이미 사용 중인 닉네임이에요')
        return
      }
      if (extractIsForbiddenFromValidResponse(response)) {
        onVerifiedChange(false)
        onStatusChange('forbidden')
        onMessageChange('사용할 수 없는 닉네임이에요')
        return
      }
      onVerifiedChange(false)
      onStatusChange('taken')
      onMessageChange(response.message || '닉네임 확인에 실패했어요')
    } catch {
      onVerifiedChange(false)
      onStatusChange('taken')
      onMessageChange('닉네임 확인 중 오류가 발생했어요')
    }
  }

  return (
    <View>
      <Text style={styles.title}>프로필을 설정해주세요</Text>
      <Text style={styles.subtitle}>닉네임과 프로필 사진을 설정해 주세요</Text>

      <View style={styles.profileWrap}>
        <View style={styles.profileImageWrap}>
          <Image
            source={profileImageUri ? { uri: profileImageUri } : profilePhoto}
            style={styles.profileImage}
            contentFit="cover"
          />
          <Pressable style={styles.profileChangeButton} onPress={() => void handlePickImage()}>
            <Image source={profileChange} style={styles.profileChangeIcon} contentFit="contain" />
          </Pressable>
        </View>
      </View>

      <View style={styles.inputSection}>
        <View style={styles.inputRow}>
          <TextInput
            value={value}
            onChangeText={(text) => {
              onChange(text)
              onVerifiedChange(false)
              onStatusChange('idle')
              onMessageChange('')
            }}
            placeholder="닉네임을 입력하세요"
            placeholderTextColor={Gray[300]}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
            style={[
              styles.input,
              value.length > 0 && status === 'idle' && { borderBottomColor: C.text },
              status === 'ok' && { borderBottomColor: C.activeDot },
              (status === 'taken' || status === 'invalid' || status === 'forbidden') && { borderBottomColor: C.error },
            ]}
          />

          <Pressable onPress={() => void handleCheck()} style={styles.checkButton}>
            <Image
              source={normalized ? idCheckPink : idCheckGray}
              style={styles.checkImage}
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
  title: {
        ...Typography.heading1,
    color: C.text,
  },
  subtitle: {
    marginTop: 5,
    ...Typography.body1Medium,
    color: Gray[500],
  },
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
    borderRadius: 50,
  },
  profileChangeButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
  },
  profileChangeIcon: {
    width: 32,
    height: 32,
  },
  inputSection: {
    marginTop: 36,
    width: '100%',
  },
  inputRow: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 42,
    paddingTop: 10,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 8,
    borderBottomWidth: 2,
    borderBottomColor: Gray[300],
    ...Typography.body1Medium,
    color: C.text,
  },
  checkButton: {
    width: 102,
    height: 38,
  },
  checkImage: {
    width: 102,
    height: 38,
  },
  message: {
    marginTop: 6,
    marginLeft: 8,
    ...Typography.caption1Medium,
  },
  messageOk: {
    color: C.activeDot,
  },
  messageError: {
    color: C.error,
  },
})
