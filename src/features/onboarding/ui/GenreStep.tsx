import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { GenreKey } from '../../auth'
import { C, Gray, Typography } from '../../../theme'

const genreAssets: Record<GenreKey, any> = {
  ROMANCE: require('../../../../assets/onboarding/romance.svg'),
  FANTASY: require('../../../../assets/onboarding/fantasy.svg'),
  ROFAN: require('../../../../assets/onboarding/rofan.svg'),
  HISTORICAL: require('../../../../assets/onboarding/genre-select.svg'),
  DRAMA: require('../../../../assets/onboarding/drama.svg'),
  THRILLER: require('../../../../assets/onboarding/thriller.svg'),
  ACTION: require('../../../../assets/onboarding/action.svg'),
  BL: require('../../../../assets/onboarding/bl.svg'),
  MODERN_FANTASY: require('../../../../assets/onboarding/mofan.svg'),
  DAILY: require('../../../../assets/onboarding/daily.svg'),
}

const labels: Record<GenreKey, string> = {
  FANTASY: '판타지',
  ACTION: '무협',
  MODERN_FANTASY: '현판',
  ROMANCE: '로맨스',
  ROFAN: '로판',
  DAILY: '일상',
  BL: 'BL',
  THRILLER: '스릴러',
  DRAMA: '드라마',
  HISTORICAL: '사극',
}

const order: GenreKey[] = [
  'FANTASY',
  'ACTION',
  'MODERN_FANTASY',
  'ROMANCE',
  'ROFAN',
  'DAILY',
  'BL',
  'THRILLER',
  'DRAMA',
]

export function GenreStep({
  value,
  onChange,
}: {
  value: GenreKey[]
  onChange: (value: GenreKey[]) => void
}) {
  const toggle = (genre: GenreKey) => {
    if (value.includes(genre)) {
      onChange(value.filter((item) => item !== genre))
      return
    }
    if (value.length < 3) onChange([...value, genre])
  }

  return (
    <View>
      <Text style={styles.title}>즐겨보는 장르를 선택해 주세요</Text>
      {value.length > 0 ? (
        <Text style={styles.subtitle}>
          {'최소 1개~최대 3개 선택가능 '}
          <Text style={styles.count}>({value.length}/3)</Text>
        </Text>
      ) : (
        <Text style={styles.subtitle}>선택을 기반으로 웹툰/웹소설을 추천드려요</Text>
      )}

      <View style={styles.grid}>
        {order.map((genre) => {
          const selected = value.includes(genre)
          const disabled = !selected && value.length >= 3
          return (
            <Pressable
              key={genre}
              onPress={() => !disabled && toggle(genre)}
              style={({ pressed }) => [styles.genreButton, pressed && !disabled && styles.pressed]}
            >
              <Image
                source={genreAssets[genre]}
                style={[
                  styles.genreIcon,
                  { tintColor: disabled ? Gray[400] : selected ? C.primary : C.text },
                ]}
                contentFit="contain"
              />
              <Text
                style={[
                  styles.genreLabel,
                  { color: disabled ? Gray[400] : selected ? C.primary : C.text },
                ]}
              >
                {labels[genre]}
              </Text>
            </Pressable>
          )
        })}
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
  count: {
    ...Typography.body1Medium,
    color: C.primary,
  },
  grid: {
    marginTop: 80,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 20,
  },
  genreButton: {
    width: '33.3333%',
    alignItems: 'center',
  },
  genreIcon: {
    width: 80,
    height: 80,
  },
  genreLabel: {
    marginTop: 12,
    ...Typography.body1Medium,
    color: C.text,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
})
