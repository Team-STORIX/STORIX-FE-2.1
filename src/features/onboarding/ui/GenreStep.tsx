import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { GenreKey } from '../../auth'

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
  ACTION: '액션',
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
      <View style={styles.subRow}>
        <Text style={styles.subtitle}>
          선택 장르를 기반으로 작품과 키워드를 추천해드려요
        </Text>
        {value.length > 0 ? <Text style={styles.count}>({value.length}/3)</Text> : null}
      </View>

      <View style={styles.grid}>
        {order.map((genre) => {
          const selected = value.includes(genre)
          const disabled = !selected && value.length >= 3
          return (
            <Pressable
              key={genre}
              onPress={() => !disabled && toggle(genre)}
              style={({ pressed }) => [styles.genreButton, pressed && styles.pressed, disabled && styles.disabled]}
            >
              <Image
                source={genreAssets[genre]}
                style={[styles.genreIcon, { tintColor: selected ? '#FF4093' : '#131112' }]}
                contentFit="contain"
              />
              <Text style={[styles.genreLabel, selected && styles.genreLabelSelected]}>{labels[genre]}</Text>
            </Pressable>
          )
        })}
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
  subRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#847B7F',
  },
  count: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#FF4093',
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
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#131112',
    textAlign: 'center',
  },
  genreLabelSelected: {
    color: '#FF4093',
  },
  disabled: {
    opacity: 0.3,
  },
  pressed: {
    opacity: 0.8,
  },
})
