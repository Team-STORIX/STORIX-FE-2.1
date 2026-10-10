import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import type { MeProfileResult } from '../../../types/profile'
import { OfficialMark } from '../../../components/common/OfficialMark'
import { C, Gray, Magenta, Radius, Typography } from '../../../theme'

const nextArrowIcon = require('../../../../assets/icons/common/icon-arrow-gray.svg')
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
          {me.title ? (
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{me.title}</Text>
            </View>
          ) : null}

          <View style={styles.nicknameRow}>
            <Text style={styles.nickname} numberOfLines={1}>{me.nickName}</Text>
            <OfficialMark role={me.role} />
          </View>
          <Text style={[styles.bio, !hasBio && styles.bioPlaceholder]} numberOfLines={1}>
            {hasBio ? me.profileDescription : '한줄소개를 입력해보세요 !'}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/profile/fix')}
        style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={'프로필 수정'}
      >
        <Image source={nextArrowIcon} style={styles.editIcon} contentFit="contain" tintColor={Gray[500]} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 28,
    backgroundColor: C.card,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  avatar: {
    width: 80,
    height: 80,
  },
  textWrap: {
    width: 200,
    alignItems: 'flex-start',
    gap: 6,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 50,
    alignSelf: 'flex-start',
    backgroundColor: Magenta[50],
  },
  levelBadgeText: {
    ...Typography.caption2Extrabold,
    letterSpacing: 0.2,
    color: Magenta[300],
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  nickname: {
    ...Typography.heading3,
    flexShrink: 1,
    textAlign: 'left',
    color: C.text,
  },
  bio: {
    ...Typography.caption1Medium,
    width: '100%',
    textAlign: 'left',
    maxWidth: 200,
    color: Gray[600],
  },
  bioPlaceholder: {
    color: Gray[400],
  },
  editButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    width: 24,
    height: 24,
  },
  pressed: {
    opacity: 0.7,
  },
})
