import { StyleSheet, Text, TextInput, View } from 'react-native'
import { C, Gray, Typography } from '../../../theme'
import { BIO_MAX_LENGTH } from '../lib/constants'
import { OnboardingStepHeader } from './OnboardingStepHeader'

type BioStepProps = {
  value: string
  onChange: (value: string) => void
  /** 프로필 수정 화면에서는 제목 없이 입력만 재사용한다. */
  showHeader?: boolean
}

export function BioStep({ value, onChange, showHeader = true }: BioStepProps) {
  return (
    <View>
      {showHeader && (
        <OnboardingStepHeader title="한 줄 소개를 작성해 주세요" subtitle="내 취향을 마음껏 표현해보세요" />
      )}

      <View style={[styles.inputBlock, !showHeader && styles.inputBlockEdit]}>
        <View style={[styles.inputUnderline, value.length > 0 && { borderBottomColor: C.text }]}>
          <TextInput
            value={value}
            onChangeText={(next) => onChange(next.slice(0, BIO_MAX_LENGTH))}
            placeholder="나를 소개하는 글을 적어보세요"
            placeholderTextColor={Gray[300]}
            style={styles.input}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.counterWrap}>
          <Text style={styles.counter}>{value.length}/{BIO_MAX_LENGTH}자</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  inputBlock: {
    marginTop: 84,
    width: '100%',
  },
  inputBlockEdit: {
    marginTop: 0,
    width: '100%',
  },
  inputUnderline: {
    height: 42,
    borderBottomWidth: 2,
    borderBottomColor: Gray[300],
  },
  input: {
    height: 42,
    paddingTop: 10,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 8,
    ...Typography.body1Medium,
    color: C.text,
  },
  counterWrap: {
    marginTop: 6,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  counter: {
    ...Typography.caption1Medium,
    color: C.primary,
  },
})
