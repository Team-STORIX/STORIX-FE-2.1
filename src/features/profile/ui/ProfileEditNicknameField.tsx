import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import {
  extractIsAvailableFromValidResponse,
  extractIsDuplicatedFromValidResponse,
  extractIsForbiddenFromValidResponse,
} from '../../auth/api/nickname.api'
import {
  getNicknameFallbackErrorMessage,
  getNicknameFormatErrorMessage,
  NICKNAME_MESSAGES,
} from '../../auth/lib/nickname-validation'
import { checkProfileNicknameValid } from '../api/profile-nickname.api'
import { C, Gray, Typography } from '../../../theme'

const nicknameCheckActive = require('../../../../assets/onboarding/id-check-pink.svg')
const nicknameCheckInactive = require('../../../../assets/onboarding/id-check-gray.svg')

type Status = 'idle' | 'invalid' | 'same' | 'checking' | 'ok' | 'taken' | 'forbidden' | 'error'

type Props = {
  currentNickname: string
  value: string
  onChange: (value: string) => void
  onVerifiedChange: (verified: boolean) => void
}

const MSG_SAME = '\ud604\uc7ac \ub2c9\ub124\uc784\uc774\uc5d0\uc694'

export function ProfileEditNicknameField({
  currentNickname,
  value,
  onChange,
  onVerifiedChange,
}: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const initRef = useRef(false)

  const normalizedCurrentNickname = currentNickname.trim()
  const normalizedValue = value.trim()

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
      const initialStatus = normalizedValue === normalizedCurrentNickname ? 'same' : 'idle'
      setStatus(initialStatus)
      setMessage('')
      onVerifiedChange(initialStatus === 'same')
    }
  }, [normalizedCurrentNickname, normalizedValue, onVerifiedChange])

  const canCheck = normalizedValue.length > 0 && status !== 'checking'

  const validate = (raw: string): { nextStatus: Status; nextMessage: string } => {
    if (!raw.length) return { nextStatus: 'idle', nextMessage: '' }
    const formatErrorMessage = getNicknameFormatErrorMessage(raw)
    if (formatErrorMessage) {
      return { nextStatus: 'invalid', nextMessage: formatErrorMessage }
    }
    if (raw === normalizedCurrentNickname) {
      return { nextStatus: 'same', nextMessage: MSG_SAME }
    }
    return { nextStatus: 'idle', nextMessage: '' }
  }

  const handleChangeText = (next: string) => {
    onChange(next)
    const isSameNickname = next.trim() === normalizedCurrentNickname
    setStatus(isSameNickname ? 'same' : 'idle')
    setMessage('')
    onVerifiedChange(isSameNickname)
  }

  const handleCheck = async () => {
    if (!canCheck) return

    const { nextStatus, nextMessage } = validate(value)
    if (nextStatus !== 'idle') {
      setStatus(nextStatus)
      setMessage(nextMessage)
      onVerifiedChange(nextStatus === 'same')
      return
    }

    setStatus('checking')
    setMessage('')

    try {
      const result = await checkProfileNicknameValid(normalizedValue)

      if (extractIsDuplicatedFromValidResponse(result.raw) || result.httpStatus === 409) {
        setStatus('taken')
        setMessage(NICKNAME_MESSAGES.duplicated)
        onVerifiedChange(false)
        return
      }

      if (extractIsForbiddenFromValidResponse(result.raw) || result.httpStatus === 403) {
        setStatus('forbidden')
        setMessage(NICKNAME_MESSAGES.forbidden)
        onVerifiedChange(false)
        return
      }

      if (result.httpStatus >= 400) {
        setStatus('error')
        setMessage(getNicknameFallbackErrorMessage(result.raw.message))
        onVerifiedChange(false)
        return
      }

      if (result.available === true || extractIsAvailableFromValidResponse(result.raw)) {
        setStatus('ok')
        setMessage(NICKNAME_MESSAGES.available)
        onVerifiedChange(true)
        return
      }

      if (result.available === false) {
        setStatus('taken')
        setMessage(NICKNAME_MESSAGES.duplicated)
        onVerifiedChange(false)
        return
      }

      setStatus('error')
      setMessage(getNicknameFallbackErrorMessage(result.raw.message))
      onVerifiedChange(false)
    } catch {
      setStatus('error')
      setMessage(NICKNAME_MESSAGES.unknownError)
      onVerifiedChange(false)
    }
  }

  const underlineColor = useMemo(() => {
    if (status === 'ok' || status === 'same') return C.activeDot
    if (status === 'invalid' || status === 'taken' || status === 'forbidden' || status === 'error') {
      return C.error
    }
    if (normalizedValue.length > 0 && status === 'idle') return Gray[900]
    return Gray[300]
  }, [normalizedValue, status])

  const messageColor = status === 'ok' || status === 'same' ? C.activeDot : C.error

  return (
    <View>
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholder={'\ub2c9\ub124\uc784\uc744 \uc785\ub825\ud558\uc138\uc694'}
          placeholderTextColor={Gray[300]}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          style={[styles.input, { borderBottomColor: underlineColor }]}
        />

        <Pressable
          onPress={() => void handleCheck()}
          disabled={!canCheck}
          style={({ pressed }) => [pressed && canCheck && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={'\ub2c9\ub124\uc784 \uc911\ubcf5 \ud655\uc778'}
        >
          <Image
            source={canCheck ? nicknameCheckActive : nicknameCheckInactive}
            style={styles.checkButton}
            contentFit="contain"
          />
        </Pressable>
      </View>

      {message ? (
        <Text style={[styles.message, { color: messageColor }]}>{message}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
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
    color: Gray[900],
    ...Typography.body1Medium,
  },
  checkButton: {
    width: 102,
    height: 38,
  },
  message: {
    marginTop: 6,
    marginLeft: 8,
    fontFamily: 'SUIT',
    ...Typography.caption1Medium,
  },
  pressed: {
    opacity: 0.8,
  },
})
