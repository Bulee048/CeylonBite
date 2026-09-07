import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onActionPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textGroup}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {actionText && onActionPress && (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionText}</Text>
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
    marginVertical: Spacing.md,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default SectionHeader;
