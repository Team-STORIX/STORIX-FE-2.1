import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import type { FavoriteWorkItem } from '../api/feed/readerFavoriteWorks.api'
import { Gray, Magenta } from '../../../theme/colors'
import { Typography } from '../../../theme/typography'

const pickerPinkIcon = require('../../../../assets/icons/feed/picker-pink.svg')
const pickerGrayIcon = require('../../../../assets/icons/feed/picker-gray.svg')
const addFavoritesIcon = require('../../../../assets/icons/feed/add-favorites.svg')

type PickerItem = {
  id: string
  name: string
  thumbnailUrl?: string
}

type FeedWorksPickerProps = {
  works: FavoriteWorkItem[]
  selectedId: string
  onSelect: (id: string) => void
}

const ADD_ID = '__add__'

export function FeedWorksPicker({
  works,
  selectedId,
  onSelect,
}: FeedWorksPickerProps) {
  const router = useRouter()

  const hasFavorites = works.length > 0

  const items: PickerItem[] = [
    { id: 'all', name: '전체' },
    ...(hasFavorites
      ? works.map((w) => ({
          id: String(w.worksId),
          name: w.worksName,
          thumbnailUrl: w.thumbnailUrl,
        }))
      : []),
    { id: ADD_ID, name: '작품 추가' },
  ]

  const handlePress = (item: PickerItem) => {
    if (item.id === ADD_ID) {
      router.push('/search' as never)
      return
    }
    onSelect(item.id)
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item, idx) => {
          const isActive = selectedId === item.id
          const isAll = item.id === 'all'
          const isAdd = item.id === ADD_ID

          return (
            <View key={item.id} style={styles.itemWrapper}>
              <Pressable
                onPress={() => handlePress(item)}
                style={[styles.itemBtn, !isActive && !isAdd && styles.itemInactive]}
                accessibilityRole="button"
                aria-pressed={isActive}
              >
                <View style={styles.circle}>
                  {isAll ? (
                    <Image
                      source={isActive ? pickerPinkIcon : pickerGrayIcon}
                      style={styles.circleFill}
                      contentFit="contain"
                    />
                  ) : isAdd ? (
                    <Image
                      source={addFavoritesIcon}
                      style={styles.circleFill}
                      contentFit="contain"
                    />
                  ) : item.thumbnailUrl ? (
                    <>
                      <Image
                        source={{ uri: item.thumbnailUrl }}
                        style={styles.circleFill}
                        contentFit="cover"
                      />
                      {isActive && <View style={styles.activeOverlay} />}
                    </>
                  ) : (
                    <View style={styles.circleFallback}>
                      <Text style={styles.circleFallbackText}>
                        {item.name[0]}
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.label,
                    isActive && !isAll && !isAdd && styles.labelActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </Pressable>

              {/* Divider after first item ("전체") */}
              {idx === 0 && items.length > 1 && (
                <View style={styles.dividerWrapper}>
                  <View style={styles.divider} />
                </View>
              )}
              {idx !== 0 && idx !== items.length - 1 && (
                <View style={{ width: 16 }} />
              )}
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 110,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 20,
    borderBottomWidth: 6,
    borderBottomColor: Gray[50],
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  scrollContent: {
    alignItems: 'flex-start',
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 90,
  },
  itemBtn: {
    width: 62,
    alignItems: 'center',
  },
  itemInactive: {
    opacity: 0.5,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: Gray[100],
  },
  circleFill: {
    width: 60,
    height: 60,
  },
  activeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 64, 147, 0.22)',
  },
  circleFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Gray[100],
  },
  circleFallbackText: {
    ...Typography.heading3,
    color: Gray[500],
  },
  label: {
    marginTop: 8,
    width: 62,
    ...Typography.body2Medium,
    textAlign: 'center',
    color: Gray[900],
  },
  labelActive: {
    color: Magenta[300],
    fontWeight: '700',
  },
  dividerWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 90,
    paddingTop: 0,
  },
  divider: {
    width: 1,
    height: 90,
    backgroundColor: Gray[100],
    marginHorizontal: 16,
  },
})
