import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading tasty meals...',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  message: {
    marginTop: Spacing.md,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondaryText,
  },
});

export default LoadingState;
