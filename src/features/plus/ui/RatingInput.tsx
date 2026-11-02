import { Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { Gray, Magenta } from '../../../theme'

const ratingStarIcon = require('../../../../assets/icons/common/ratingStar.svg')

type Props = {
  value: number
  onChange: (next: number) => void
  size?: number
}

export function RatingInput({ value, onChange, size = 36 }: Props) {
  return (
    <View style={[styles.row, { gap: 4 }]}>
      {[0, 1, 2, 3, 4].map((index) => {
        const fillRaw = value - index
        const fill = fillRaw >= 1 ? 1 : fillRaw >= 0.5 ? 0.5 : 0
        const halfVal = index + 0.5
        const fullVal = index + 1

        return (
          <View
            key={index}
            style={[styles.slot, { width: size, height: size }]}
          >
            <Image
              source={ratingStarIcon}
              style={{ width: size, height: size }}
              contentFit="contain"
              tintColor={Gray[200]}
            />

            {fill > 0 ? (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { width: size * fill, overflow: 'hidden' },
                ]}
                pointerEvents="none"
              >
                <Image
                  source={ratingStarIcon}
                  style={{ width: size, height: size }}
                  contentFit="contain"
                  tintColor={Magenta[300]}
                />
              </View>
            ) : null}

            <View style={[StyleSheet.absoluteFill, styles.tapRow]}>
              <Pressable
                style={styles.tapHalf}
                onPress={() => onChange(halfVal)}
                accessibilityRole="button"
                accessibilityLabel={`${halfVal}점`}
              />
              <Pressable
                style={styles.tapHalf}
                onPress={() => onChange(fullVal)}
                accessibilityRole="button"
                accessibilityLabel={`${fullVal}점`}
              />
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slot: {
    position: 'relative',
  },
  tapRow: {
    flexDirection: 'row',
  },
  tapHalf: {
    flex: 1,
  },
})
