import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
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

export function NicknameStep({
  value,
  onChange,
  verified,
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
    if (normalized.length < 2 || normalized.length > 10) {
      onVerifiedChange(false)
      onStatusChange('invalid')
      onMessageChange('한글, 영문, 숫자, 밑줄(_) 2~10자까지 입력 가능해요')
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
      <Text style={styles.title}>닉네임을 입력해 주세요</Text>
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
            placeholder="프로필을 설정해 주세요"
            placeholderTextColor="#B0A5AA"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
            style={styles.input}
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
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    color: '#000000',
  },
  subtitle: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#847B7F',
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
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#CDC4C8',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#131112',
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
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  messageOk: {
    color: '#009126',
  },
  messageError: {
    color: '#EF433E',
  },
})
