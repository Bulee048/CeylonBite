import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import AppButton from './AppButton';

interface EmptyStateProps {
  iconName?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'fast-food-outline',
  title,
  description,
  buttonTitle,
  onButtonPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={48} color={Colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {buttonTitle && onButtonPress && (
        <AppButton
          title={buttonTitle}
          onPress={onButtonPress}
          variant="primary"
          size="medium"
          fullWidth={false}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.lightOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  button: {
    minWidth: 160,
  },
});

export default EmptyState;
