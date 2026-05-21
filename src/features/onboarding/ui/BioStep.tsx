import { StyleSheet, Text, TextInput, View } from 'react-native'

export function BioStep({
  value,
  onChange,
  showHeader = true,
}: {
  value: string
  onChange: (value: string) => void
  showHeader?: boolean
}) {
  return (
    <View>
      {showHeader && (
        <>
          <Text style={styles.title}>한 줄 소개를 작성해 주세요</Text>
          <Text style={styles.subtitle}>내 취향을 마음껏 표현해보세요</Text>
        </>
      )}

      <View style={[styles.inputBlock, !showHeader && styles.inputBlockEdit]}>
        <View style={styles.inputUnderline}>
          <TextInput
            value={value}
            onChangeText={(next) => onChange(next.slice(0, 30))}
            placeholder="나를 소개하는 글을 적어보세요"
            placeholderTextColor="#CDC4C8"
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
    width: '100%',
  },
  inputBlockEdit: {
    marginTop: 0,
    width: '100%',
  },
  inputUnderline: {
    height: 42,
    borderBottomWidth: 2,
    borderBottomColor: '#CDC4C8',
  },
  input: {
    height: 42,
    paddingTop: 10,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 8,
    fontFamily: 'SUIT',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    color: '#131112',
  },
  counterWrap: {
    marginTop: 6,
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
