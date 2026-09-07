import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightActionIcon?: keyof typeof Ionicons.glyphMap;
  onRightAction?: () => void;
  badgeCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  rightActionIcon,
  onRightAction,
  badgeCount,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primaryDark} />
          </TouchableOpacity>
        )}
        <View style={[styles.titleContainer, showBack && styles.hasBackMargin]}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
      </View>

      {rightActionIcon && (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onRightAction}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name={rightActionIcon} size={20} color={Colors.primaryDark} />
          {badgeCount !== undefined && badgeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.background,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  titleContainer: {
    flex: 1,
  },
  hasBackMargin: {
    marginLeft: Spacing.sm + 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});

export default Header;
