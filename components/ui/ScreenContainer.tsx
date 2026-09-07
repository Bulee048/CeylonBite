import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  hasPadding?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  hasPadding = true,
}) => {
  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            hasPadding && styles.padding,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, hasPadding && styles.padding, style]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100, // Generous padding so content is never obscured by bottom tabs
  },
});

export default ScreenContainer;
