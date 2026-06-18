import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { fontWeight } from '../../constants/typography';

type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<AvatarSize, number> = { sm: 32, md: 40, lg: 56 };
const FONT_MAP: Record<AvatarSize, number> = { sm: 12, md: 14, lg: 20 };

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
}

export function Avatar({ name, avatarUrl, size = 'md' }: AvatarProps) {
  const dim = SIZE_MAP[size];
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={[styles.base, { width: dim, height: dim, borderRadius: dim / 2 }]} />;
  }

  return (
    <View style={[styles.base, styles.fallback, { width: dim, height: dim, borderRadius: dim / 2 }]}>
      <Text style={[styles.initials, { fontSize: FONT_MAP[size] }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.primary[500],
    fontWeight: fontWeight.semibold,
  },
});
