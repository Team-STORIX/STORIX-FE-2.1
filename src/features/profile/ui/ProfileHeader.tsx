import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { MeProfileResult } from '../../../types/profile'
import { FontFamily, Typography } from '../../../theme/typography';
import { C } from '../../../theme/colors'

function roleLabel(role: string): string {
  if (role === 'ADMIN') return '관리자'
  if (role === 'READER') return '독자'
  if (role === 'AUTHOR') return '작가'
  return role
}

export function ProfileHeader({ me }: { me: MeProfileResult }) {
  const initial = (me.nickName || '?')[0].toUpperCase()

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrap}>
        {me.profileImageUrl ? (
          <Image
            source={{ uri: me.profileImageUrl }}
            style={styles.avatarImg}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.avatarInitial}>{initial}</Text>
        )}
      </View>

      <Text style={styles.nickName}>{me.nickName}</Text>
      <View style={styles.roleBadge}>
        <Text style={styles.roleBadgeText}>{roleLabel(me.role)}</Text>
      </View>

      {me.profileDescription ? (
        <Text style={styles.description} numberOfLines={2}>
          {me.profileDescription}
        </Text>
      ) : null}
    </View>
  )
}

const AVATAR_SIZE = 84

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
  avatarImg: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatarInitial: { fontSize: 34, fontFamily: FontFamily.extrabold, color: C.primary },

  nickName: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: C.text,
    marginBottom: 6,
  },

  roleBadge: {
    backgroundColor: C.badgeBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginBottom: 10,
  },
  roleBadgeText: { ...Typography.caption1Semibold, color: C.badgeText },

  description: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
})
