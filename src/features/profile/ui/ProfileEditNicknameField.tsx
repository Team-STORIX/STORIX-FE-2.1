import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { checkProfileNicknameValid } from '../api/profile-nickname.api'
import { C, Gray, Typography } from '../../../theme'

const nicknameCheckActive = require('../../../../assets/onboarding/id-check-pink.svg')
const nicknameCheckInactive = require('../../../../assets/onboarding/id-check-gray.svg')

type Status = 'idle' | 'invalid' | 'same' | 'checking' | 'ok' | 'taken' | 'error'

type Props = {
  currentNickname: string
  value: string
  onChange: (value: string) => void
  onVerifiedChange: (verified: boolean) => void
}

const MAX = 10
const NICKNAME_PATTERN = /^[\uac00-\ud7a3A-Za-z0-9]+$/
const MSG_INVALID = '\ud55c\uae00,\uc601\ubb38,\uc22b\uc790 2~10\uc790\uae4c\uc9c0 \uc785\ub825 \uac00\ub2a5\ud574\uc694'
const MSG_OK = '\uc0ac\uc6a9 \uac00\ub2a5\ud55c \ub2c9\ub124\uc784\uc774\uc5d0\uc694'
const MSG_SAME = '\ud604\uc7ac \ub2c9\ub124\uc784\uc774\uc5d0\uc694'
const MSG_TAKEN = '\uc774\ubbf8 \uc0ac\uc6a9 \uc911\uc778 \ub2c9\ub124\uc784\uc774\uc5d0\uc694'
const MSG_ERROR = '\ub2c9\ub124\uc784 \ud655\uc778 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc5b4\uc694. \ub2e4\uc2dc \uc2dc\ub3c4\ud574\uc8fc\uc138\uc694.'

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
      setMessage(initialStatus === 'same' ? MSG_SAME : '')
      onVerifiedChange(initialStatus === 'same')
    }
  }, [normalizedCurrentNickname, normalizedValue, onVerifiedChange])

  const canCheck = normalizedValue.length > 0 && status !== 'checking'

  const validate = (raw: string): { nextStatus: Status; nextMessage: string } => {
    const trimmed = raw.trim()
    if (!trimmed.length) return { nextStatus: 'idle', nextMessage: '' }
    if (trimmed === normalizedCurrentNickname) {
      return { nextStatus: 'same', nextMessage: MSG_SAME }
    }
    if (trimmed.length < 2 || trimmed.length > MAX || !NICKNAME_PATTERN.test(trimmed)) {
      return { nextStatus: 'invalid', nextMessage: MSG_INVALID }
    }
    return { nextStatus: 'idle', nextMessage: '' }
  }

  const handleChangeText = (next: string) => {
    const limited = next.length > MAX ? next.slice(0, MAX) : next
    onChange(limited)
    setStatus('idle')
    setMessage('')
    onVerifiedChange(false)
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

      if (result.httpStatus >= 400) {
        if (result.httpStatus === 409) {
          setStatus('taken')
          setMessage(MSG_TAKEN)
          onVerifiedChange(false)
          return
        }

        setStatus('error')
        setMessage(MSG_ERROR)
        onVerifiedChange(false)
        return
      }

      if (result.available === true || result.raw.code === 'PROFILE_SUCCESS_002') {
        setStatus('ok')
        setMessage(MSG_OK)
        onVerifiedChange(true)
        return
      }

      setStatus('taken')
      setMessage(MSG_TAKEN)
      onVerifiedChange(false)
    } catch {
      setStatus('error')
      setMessage(MSG_ERROR)
      onVerifiedChange(false)
    }
  }

  const underlineColor = useMemo(() => {
    if (status === 'ok' || status === 'same') return C.activeDot
    if (status === 'invalid' || status === 'taken' || status === 'error') return C.error
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
