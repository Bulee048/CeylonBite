import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Colors from '../../constants/colors';
import Radius from '../../constants/radius';
import Spacing from '../../constants/spacing';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  pill?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = true,
  pill = true,
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const getContainerStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: pill ? Radius.pill : Radius.lg,
    };

    // Variant style
    let variantStyle: ViewStyle = {};
    switch (variant) {
      case 'primary':
        variantStyle = { backgroundColor: Colors.primary };
        break;
      case 'secondary':
        variantStyle = { backgroundColor: Colors.primaryDark };
        break;
      case 'outline':
        variantStyle = {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: Colors.primary,
        };
        break;
      case 'ghost':
        variantStyle = { backgroundColor: 'transparent' };
        break;
    }

    // Size style
    let sizeStyle: ViewStyle = {};
    switch (size) {
      case 'small':
        sizeStyle = { paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md };
        break;
      case 'medium':
        sizeStyle = { paddingVertical: Spacing.sm + 4, paddingHorizontal: Spacing.lg };
        break;
      case 'large':
        sizeStyle = { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl };
        break;
    }

    return [
      baseStyle,
      variantStyle,
      sizeStyle,
      fullWidth ? styles.fullWidth : styles.autoWidth,
      disabled ? styles.disabled : {},
      style || {},
    ];
  };

  const getTextStyle = (): TextStyle[] => {
    let color = Colors.white;
    if (variant === 'outline' || variant === 'ghost') {
      color = Colors.primary;
    }

    let fontSize = 16;
    if (size === 'small') fontSize = 13;
    if (size === 'large') fontSize = 18;

    return [
      styles.text,
      { color, fontSize },
      textStyle || {},
    ];
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={getContainerStyle()}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} />
      ) : (
        <>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  autoWidth: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});

export default AppButton;
