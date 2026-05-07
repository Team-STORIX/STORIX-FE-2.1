import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, Gray, Radius, S, Typography } from '../../../theme'
import type { PlusWorksSearchItem } from '../api'
import { usePlusReviewDuplicateCheck, usePlusWorksSearch } from '../hooks'

const checkPinkIcon = require('../../../../assets/icons/common/check-pink.svg')
const checkGrayIcon = require('../../../../assets/icons/common/check-gray.svg')
const cancelIcon = require('../../../../assets/icons/common/cancel.svg')
const searchIcon = require('../../../../assets/icons/common/search.svg')

type Props = {
  visible: boolean
  onClose: () => void
}

function WorkResultItem({
  item,
  selected,
  onPress,
}: {
  item: PlusWorksSearchItem
  selected: boolean
  onPress: () => void
}) {
  const summary = [item.artistName, item.worksType].filter(Boolean).join(' · ')
  const detail = [item.platform, item.genre].filter(Boolean).join(' · ')

  return (
    <Pressable
      style={({ pressed }) => [styles.itemRow, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={selected ? { selected: true } : {}}
    >
      <View style={styles.itemThumbWrap}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.itemThumb} contentFit="cover" />
        ) : (
          <View style={styles.itemThumbFallback}>
            <Text style={styles.itemThumbFallbackText}>
              {(item.worksName ?? '').trim().charAt(0) || '?'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.itemTextWrap}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.worksName ?? '작품'}
        </Text>
        {summary ? (
          <Text style={styles.itemSummary} numberOfLines={1}>
            {summary}
          </Text>
        ) : null}
        {detail ? (
          <Text style={styles.itemDetail} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>

      <Image
        source={selected ? checkPinkIcon : checkGrayIcon}
        style={styles.selectIcon}
        contentFit="contain"
      />
    </Pressable>
  )
}

export function ReviewWriteBottomSheet({ visible, onClose }: Props) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const progress = useRef(new Animated.Value(0)).current
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [selectedWorkId, setSelectedWorkId] = useState<number>()

  useEffect(() => {
    if (!visible) {
      progress.setValue(0)
      return
    }

    setKeyword('')
    setDebouncedKeyword('')
    setSelectedWorkId(undefined)

    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start()
  }, [progress, visible])

  useEffect(() => {
    if (!visible) return

    const timeout = setTimeout(() => {
      setDebouncedKeyword(keyword.trim())
    }, 300)

    return () => clearTimeout(timeout)
  }, [keyword, visible])

  const searchQuery = usePlusWorksSearch({
    keyword: debouncedKeyword,
    size: 20,
  })

  const works = useMemo(
    () => searchQuery.data?.pages.flatMap((page) => page.result.content) ?? [],
    [searchQuery.data?.pages],
  )

  const selectedWork = useMemo(
    () => works.find((item) => item.worksId === selectedWorkId),
    [selectedWorkId, works],
  )

  const duplicateQuery = usePlusReviewDuplicateCheck(selectedWorkId)

  const handleClose = (afterClose?: () => void) => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onClose()
        afterClose?.()
      }
    })
  }

  const reviewBlocked = duplicateQuery.data?.result.isDuplicated ?? false
  const reviewButtonDisabled =
    !selectedWork || duplicateQuery.isLoading || duplicateQuery.isFetching || reviewBlocked

  const reviewButtonLabel = !selectedWork
    ? '작품을 선택해 주세요'
    : duplicateQuery.isLoading || duplicateQuery.isFetching
      ? '리뷰 작성 여부를 확인 중이에요'
      : reviewBlocked
        ? '이미 리뷰를 작성한 작품이에요'
        : '리뷰 작성하러 가기'

  if (!visible) {
    return null
  }

  return (
    <Modal transparent animationType="none" visible onRequestClose={() => handleClose()}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => handleClose()} />

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 18,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardWrap}
          >
            <View style={styles.header}>
              <Text style={styles.title}>작품선택</Text>
              <Pressable onPress={() => handleClose()} style={styles.closeButton}>
                <Image source={cancelIcon} style={styles.closeIcon} contentFit="contain" />
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <TextInput
                value={keyword}
                onChangeText={setKeyword}
                placeholder="어떤 이야기를 하고 싶은 작품을 검색해 주세요"
                placeholderTextColor={C.textMuted}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />

              {keyword.length > 0 ? (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => {
                    setKeyword('')
                    setSelectedWorkId(undefined)
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="검색어 지우기"
                >
                  <Image source={cancelIcon} style={styles.clearIcon} contentFit="contain" />
                </Pressable>
              ) : (
                <Image source={searchIcon} style={styles.searchFieldIcon} contentFit="contain" />
              )}
            </View>

            <View style={styles.listWrap}>
              {!debouncedKeyword ? (
                <View style={styles.stateWrap}>
                  <Text style={styles.stateTitle}>리뷰를 작성할 작품을 검색해 주세요.</Text>
                  <Text style={styles.stateBody}>
                    작품을 선택하면 다음 단계에서 리뷰 작성 화면으로 이동해요.
                  </Text>
                </View>
              ) : searchQuery.isLoading ? (
                <View style={styles.stateWrap}>
                  <ActivityIndicator size="small" color={C.primary} />
                </View>
              ) : searchQuery.isError ? (
                <View style={styles.stateWrap}>
                  <Text style={styles.stateTitle}>작품을 불러오지 못했어요.</Text>
                  <Text style={styles.stateBody}>검색어를 다시 확인해 주세요.</Text>
                </View>
              ) : works.length === 0 ? (
                <View style={styles.stateWrap}>
                  <Text style={styles.stateTitle}>검색 결과가 없어요.</Text>
                  <Text style={styles.stateBody}>다른 키워드로 다시 찾아보세요.</Text>
                </View>
              ) : (
                <FlatList
                  data={works}
                  keyExtractor={(item) => String(item.worksId)}
                  renderItem={({ item }) => (
                    <WorkResultItem
                      item={item}
                      selected={item.worksId === selectedWorkId}
                      onPress={() =>
                        setSelectedWorkId((current) =>
                          current === item.worksId ? undefined : item.worksId,
                        )
                      }
                    />
                  )}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  onEndReachedThreshold={0.5}
                  onEndReached={() => {
                    if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
                      void searchQuery.fetchNextPage()
                    }
                  }}
                  ListFooterComponent={
                    searchQuery.isFetchingNextPage ? (
                      <ActivityIndicator
                        size="small"
                        color={C.primary}
                        style={styles.nextPageLoader}
                      />
                    ) : null
                  }
                />
              )}
            </View>

            {selectedWork ? (
              <View style={styles.footer}>
                <Text style={styles.footerCaption} numberOfLines={1}>
                  선택한 작품: {selectedWork.worksName ?? '작품'}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    reviewButtonDisabled && styles.primaryButtonDisabled,
                    pressed && !reviewButtonDisabled && styles.pressed,
                  ]}
                  disabled={reviewButtonDisabled}
                  onPress={() => {
                    if (!selectedWork) return

                    handleClose(() => {
                      router.push(`/review/write?worksId=${selectedWork.worksId}` as never)
                    })
                  }}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      reviewButtonDisabled && styles.primaryButtonTextDisabled,
                    ]}
                  >
                    {reviewButtonLabel}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    height: '80%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    backgroundColor: C.card,
    paddingHorizontal: S.screenH,
  },
  keyboardWrap: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    ...Typography.heading2,
    color: C.text,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  searchWrap: {
    marginBottom: 16,
    justifyContent: 'center',
  },
  searchInput: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: Gray[50],
    paddingLeft: 16,
    paddingRight: 44,
    paddingVertical: 14,
    color: C.text,
    ...Typography.body2Medium,
  },
  searchFieldIcon: {
    position: 'absolute',
    right: 16,
    width: 20,
    height: 20,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    width: 16,
    height: 16,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  itemThumbWrap: {
    width: 87,
    height: 116,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Gray[100],
  },
  itemThumb: {
    width: 87,
    height: 116,
  },
  itemThumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primaryLight,
  },
  itemThumbFallbackText: {
    ...Typography.body1Bold,
    color: C.primary,
  },
  itemTextWrap: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    ...Typography.body1Semibold,
    color: C.text,
  },
  itemSummary: {
    ...Typography.body2Medium,
    color: C.textSecondary,
  },
  itemDetail: {
    ...Typography.caption1Medium,
    color: C.textMuted,
  },
  selectIcon: {
    width: 24,
    height: 24,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  stateTitle: {
    ...Typography.body1Semibold,
    color: C.text,
    textAlign: 'center',
  },
  stateBody: {
    ...Typography.body2Medium,
    color: C.textMuted,
    textAlign: 'center',
  },
  nextPageLoader: {
    marginVertical: 16,
  },
  footer: {
    gap: 10,
    paddingTop: 14,
  },
  footerCaption: {
    ...Typography.caption1Medium,
    color: C.textSecondary,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    backgroundColor: C.primary,
    paddingVertical: 15,
  },
  primaryButtonDisabled: {
    backgroundColor: C.primaryLight,
  },
  primaryButtonText: {
    ...Typography.body1Semibold,
    color: C.card,
  },
  primaryButtonTextDisabled: {
    color: C.primary,
  },
  pressed: {
    opacity: 0.75,
  },
})
