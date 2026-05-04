import { StyleSheet, Text, TextInput, View } from 'react-native'

export function BioStep({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <View>
      <Text style={styles.title}>한 줄 소개를 작성해 주세요</Text>
      <Text style={styles.subtitle}>내 취향과 마음을 표현해보세요</Text>

      <View style={styles.inputBlock}>
        <View style={styles.inputUnderline}>
          <TextInput
            value={value}
            onChangeText={(next) => onChange(next.slice(0, 30))}
            placeholder="자기소개를 입력해보세요 !"
            placeholderTextColor="#B0A5AA"
            style={styles.input}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.counterWrap}>
          <Text style={styles.counter}>{value.length}/30자</Text>
        </View>
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
  inputBlock: {
    marginTop: 84,
    width: 361,
  },
  inputUnderline: {
    borderBottomWidth: 2,
    borderBottomColor: '#CDC4C8',
    paddingTop: 12,
    paddingBottom: 12,
    paddingRight: 10,
    paddingLeft: 8,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#131112',
  },
  counterWrap: {
    marginTop: 8,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  counter: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: '#FF4093',
  },
})
