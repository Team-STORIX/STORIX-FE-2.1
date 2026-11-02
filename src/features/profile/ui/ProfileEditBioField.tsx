import { StyleSheet, Text, TextInput, View } from 'react-native'
import { Gray, Magenta, Typography } from '../../../theme'

type Props = {
  value: string
  onChange: (value: string) => void
}

const PLACEHOLDER = '\ud55c\uc904\uc18c\uac1c\ub97c \uc785\ub825\ud574\ubcf4\uc138\uc694 !'

export function ProfileEditBioField({ value, onChange }: Props) {
  return (
    <View>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={(next) => onChange(next.length > 30 ? next.slice(0, 30) : next)}
          placeholder={PLACEHOLDER}
          placeholderTextColor={Gray[300]}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          style={styles.input}
        />
      </View>

      <View style={styles.counterRow}>
        <Text style={styles.counter}>{value.length}/30자</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  inputWrap: {
    width: '100%',
    paddingTop: 12,
    paddingRight: 10,
    paddingBottom: 12,
    paddingLeft: 8,
    borderBottomWidth: 2,
    borderBottomColor: Gray[300],
  },
  input: {
    ...Typography.body1Medium,
    color: Gray[900],
    padding: 0,
  },
  counterRow: {
    width: '100%',
    marginTop: 8,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  counter: {
    ...Typography.caption1Medium,
    color: Magenta[300],
  },
})
