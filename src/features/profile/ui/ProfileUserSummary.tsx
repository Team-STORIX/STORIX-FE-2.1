import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import type { MeProfileResult } from '../../../types/profile'
import { C, Gray, Magenta, Radius } from '../../../theme'

const nextArrowIcon = require('../../../../assets/icons/common/arrow-next.svg')
const defaultProfileImage = require('../../../../assets/placeholders/profile-default.png')

export function ProfileUserSummary({ me }: { me: MeProfileResult }) {
  const router = useRouter()
  const hasBio = (me.profileDescription ?? '').trim().length > 0

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        <View style={styles.avatarWrap}>
          <Image
            source={me.profileImageUrl ? { uri: me.profileImageUrl } : defaultProfileImage}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>

        <View style={styles.textWrap}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Lv.{me.level}</Text>
          </View>

          <Text style={styles.nickname}>{me.nickName}</Text>
          <Text style={[styles.bio, !hasBio && styles.bioPlaceholder]}>
            {hasBio ? me.profileDescription : '한줄소개를 입력해보세요 !'}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/profile/fix')}
        style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={'\ud504\ub85c\ud544 \uc218\uc815'}
      >
        <Image source={nextArrowIcon} style={styles.editIcon} contentFit="contain" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 28,
    backgroundColor: C.card,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatar: {
    width: 80,
    height: 80,
  },
  textWrap: {
    alignItems: 'flex-start',
    flexShrink: 1,
    paddingRight: 24,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 50,
    backgroundColor: Magenta[200],
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
    letterSpacing: 0.2,
    color: C.text,
  },
  nickname: {
    marginTop: 7,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
    color: C.text,
  },
  bio: {
    marginTop: 7,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: Gray[600],
  },
  bioPlaceholder: {
    color: Gray[400],
  },
  editButton: {
    position: 'absolute',
    right: 20,
    top: 55,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    width: 16,
    height: 16,
  },
  pressed: {
    opacity: 0.7,
  },
})
