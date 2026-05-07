import { useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { Gray, Magenta } from '../../../theme/colors'
import { Typography } from '../../../theme/typography'

// ─── Assets ──────────────────────────────────────────────────────────────────

const likeIcon           = require('../../../../assets/icons/common/icon-like.svg')
const likePinkIcon       = require('../../../../assets/icons/common/icon-like-pink.svg')
const commentIcon        = require('../../../../assets/icons/common/icon-comment.svg')
const menuIcon           = require('../../../../assets/icons/common/menu-3dots.svg')
const arrowSmallIcon     = require('../../../../assets/icons/common/icon-arrow-forward-small.svg')
const commentDropdown    = require('../../../../assets/icons/common/comment-dropdown.svg')
const deleteDropdown     = require('../../../../assets/icons/common/delete-dropdown.svg')
const defaultProfileImage = require('../../../../assets/placeholders/profile-default.png')

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostCardWorks = {
  thumbnailUrl: string
  worksName: string
  artistName: string
  worksType: string
  genre: string
  hashtags: string[]
}

type FeedPostCardVariant = 'list' | 'detail'

type FeedPostCardProps = {
  variant?: FeedPostCardVariant
  boardId: number
  writerUserId: number
  currentUserId?: number
  profileImageUrl?: string | null
  nickName: string
  createdAt?: string | null
  content: string
  images?: string[]
  works?: PostCardWorks | null
  isSpoiler?: boolean
  spoilerScript?: string
  isLiked: boolean
  likeCount: number
  replyCount: number
  onToggleLike: () => void
  onClickWorksArrow?: () => void
  onOpenReport?: () => void
  onOpenDelete?: () => void
  onPressCard?: () => void
}

// ─── HashtagRow ───────────────────────────────────────────────────────────────

function HashtagRow({ tags }: { tags: string[] }) {
  if (!tags.length) return null
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.hashtagScroll}
      contentContainerStyle={styles.hashtagContent}
    >
      {tags.map((tag, i) => (
        <View key={`${tag}-${i}`} style={styles.hashtagChip}>
          <Text style={styles.hashtagText}>{tag.startsWith('#') ? tag : `#${tag}`}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

// ─── FeedPostCard ─────────────────────────────────────────────────────────────

export function FeedPostCard({
  variant = 'list',
  boardId,
  writerUserId,
  currentUserId,
  profileImageUrl,
  nickName,
  createdAt,
  content,
  images = [],
  works,
  isSpoiler = false,
  spoilerScript,
  isLiked,
  likeCount,
  replyCount,
  onToggleLike,
  onClickWorksArrow,
  onOpenReport,
  onOpenDelete,
  onPressCard,
}: FeedPostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [spoilerRevealed, setSpoilerRevealed] = useState(false)

  const isMine = currentUserId != null && writerUserId === currentUserId
  const isSpoilerHidden = isSpoiler && !spoilerRevealed

  const showWorks =
    works != null &&
    !!works.thumbnailUrl &&
    !!works.worksName &&
    !!works.artistName

  const cardBody = (
    <View style={styles.card}>
      {/* ── Profile row ───────────────────────────────────────── */}
      <Pressable
        style={styles.profileRow}
        onPress={() => setMenuOpen(false)}
      >
        <View style={styles.avatarWrap}>
          <Image
            source={profileImageUrl ? { uri: profileImageUrl } : defaultProfileImage}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>

        <View style={styles.authorMeta}>
          <Text style={styles.authorName}>{nickName}</Text>
          {!!createdAt && (
            <Text style={styles.timestamp}>{createdAt}</Text>
          )}
        </View>

        {/* Menu button */}
        <Pressable
          hitSlop={8}
          onPress={() => setMenuOpen((v) => !v)}
          style={styles.menuBtn}
          accessibilityLabel="메뉴"
        >
          <Image
            source={menuIcon}
            style={styles.menuIcon}
            contentFit="contain"
          />
        </Pressable>
      </Pressable>

      {/* ── Menu dropdown ─────────────────────────────────────── */}
      {menuOpen && (
        <Pressable
          style={styles.menuDropdown}
          onPress={() => {
            setMenuOpen(false)
            if (isMine) onOpenDelete?.()
            else onOpenReport?.()
          }}
        >
          <Image
            source={isMine ? deleteDropdown : commentDropdown}
            style={styles.menuDropdownImg}
            contentFit="contain"
          />
        </Pressable>
      )}

      {/* ── Works card ────────────────────────────────────────── */}
      {showWorks && (
        <View style={styles.worksSection}>
          <View style={styles.worksCard}>
            <View style={styles.worksThumbnailBox}>
              <Image
                source={{ uri: works!.thumbnailUrl }}
                style={styles.worksThumbnail}
                contentFit="cover"
              />
            </View>

            <View style={styles.worksInfo}>
              <Text style={styles.worksName} numberOfLines={1}>
                {works!.worksName}
              </Text>
              <Text style={styles.worksMeta} numberOfLines={1}>
                {[works!.artistName, works!.worksType, works!.genre]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <HashtagRow tags={works!.hashtags ?? []} />
            </View>

            {onClickWorksArrow && (
              <Pressable
                onPress={onClickWorksArrow}
                hitSlop={8}
                style={styles.worksArrowBtn}
                accessibilityLabel="작품 상세 보기"
              >
                <Image
                  source={arrowSmallIcon}
                  style={styles.arrowSmall}
                  contentFit="contain"
                />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* ── Body: images + text ──────────────────────────────── */}
      <View style={styles.bodySection}>
        {/* Images — 스포일러 숨김 상태에서는 이미지도 숨김 */}
        {images.length > 0 && !isSpoilerHidden && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
            contentContainerStyle={styles.imageContent}
          >
            {images.slice(0, 3).map((src, idx) => (
              <View
                key={`${boardId}-img-${idx}`}
                style={styles.imageBox}
              >
                <Image
                  source={{ uri: src }}
                  style={styles.imageFill}
                  contentFit="cover"
                />
              </View>
            ))}
          </ScrollView>
        )}

        {/* 스포일러 숨김: 버튼만 표시 / 공개: 텍스트 표시 */}
        {isSpoilerHidden ? (
          <Pressable
            style={[styles.textPad, styles.spoilerReveal]}
            onPress={() => setSpoilerRevealed(true)}
            accessibilityLabel="스포일러가 포함된 피드글 보기"
          >
            <Text style={styles.spoilerRevealText}>
              {spoilerScript ?? '스포일러가 포함된 피드글 보기'}
            </Text>
          </Pressable>
        ) : (
          <View style={[styles.textPad, images.length > 0 && styles.textPadAfterImage]}>
            <Text
              style={styles.contentText}
              numberOfLines={variant === 'detail' ? undefined : 3}
            >
              {content}
            </Text>
          </View>
        )}
      </View>

      {/* ── Reactions row ────────────────────────────────────── */}
      <View style={styles.reactionRow}>
        <Pressable
          onPress={onToggleLike}
          style={styles.reactionItem}
          accessibilityLabel="좋아요"
          hitSlop={8}
        >
          <Image
            source={isLiked ? likePinkIcon : likeIcon}
            style={styles.reactionIcon}
            contentFit="contain"
          />
          {likeCount > 0 && (
            <Text style={styles.reactionCount}>{likeCount}</Text>
          )}
        </Pressable>

        <View style={[styles.reactionItem, styles.commentItem]}>
          <Image
            source={commentIcon}
            style={styles.reactionIcon}
            contentFit="contain"
          />
          {replyCount > 0 && (
            <Text style={styles.reactionCount}>{replyCount}</Text>
          )}
        </View>
      </View>
    </View>
  )

  if (variant === 'list' && onPressCard) {
    return (
      <Pressable
        onPress={onPressCard}
        style={({ pressed }) => pressed && styles.cardPressed}
        accessibilityRole="button"
        accessibilityLabel={`${nickName}의 피드`}
      >
        {cardBody}
      </Pressable>
    )
  }

  return cardBody
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  cardPressed: {
    opacity: 0.9,
  },
  card: {
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Gray[100],
    backgroundColor: '#ffffff',
  },

  // Profile row
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 41,
    paddingHorizontal: 16,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: Gray[200],
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: Gray[900],
  },
  timestamp: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: Gray[300],
  },
  menuBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    width: 24,
    height: 24,
  },

  // Menu dropdown
  menuDropdown: {
    position: 'absolute',
    right: 16,
    top: 52,
    zIndex: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  menuDropdownImg: {
    width: 96,
    height: 36,
  },

  // Works section
  worksSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  worksCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Gray[100],
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  worksThumbnailBox: {
    width: 62,
    height: 83,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Gray[200],
    flexShrink: 0,
  },
  worksThumbnail: {
    width: 62,
    height: 83,
  },
  worksInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  worksName: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#000000',
  },
  worksMeta: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: Gray[500],
  },
  worksArrowBtn: {
    paddingLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  arrowSmall: {
    width: 24,
    height: 24,
  },

  // Hashtag
  hashtagScroll: {
    marginTop: 2,
  },
  hashtagContent: {
    gap: 4,
  },
  hashtagChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Gray[100],
    backgroundColor: Gray[50],
  },
  hashtagText: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: 0.2,
    color: Gray[800],
  },

  // Body
  bodySection: {
    marginTop: 20,
    position: 'relative',
  },
  imageScroll: {
    paddingHorizontal: 0,
  },
  imageContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  imageBox: {
    width: 236,
    height: 236,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Gray[100],
    overflow: 'hidden',
    backgroundColor: Gray[200],
    flexShrink: 0,
  },
  imageFill: {
    width: 236,
    height: 236,
  },
  textPad: {
    paddingHorizontal: 16,
    paddingRight: 56,
  },
  textPadAfterImage: {
    marginTop: 12,
  },
  contentText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: Gray[800],
  },
  spoilerReveal: {
    minHeight: 48,
    justifyContent: 'center',
  },
  spoilerRevealText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: Magenta[300],
  },

  // Reactions
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentItem: {
    marginLeft: 16,
  },
  reactionIcon: {
    width: 24,
    height: 24,
  },
  reactionCount: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    color: Gray[500],
  },
})
