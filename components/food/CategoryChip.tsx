import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../../types';
import Colors from '../../constants/colors';
import Radius from '../../constants/radius';
import Spacing from '../../constants/spacing';

interface CategoryChipProps {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  isSelected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.chip,
        isSelected ? styles.chipSelected : styles.chipUnselected,
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          isSelected ? styles.iconCircleSelected : styles.iconCircleUnselected,
        ]}
      >
        <Ionicons
          name={category.iconName as keyof typeof Ionicons.glyphMap}
          size={14}
          color={isSelected ? Colors.primary : Colors.secondaryText}
        />
      </View>
      <Text
        style={[
          styles.label,
          isSelected ? styles.labelSelected : styles.labelUnselected,
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: Spacing.md - 2,
    borderRadius: Radius.pill,
    marginRight: Spacing.sm,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipUnselected: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  iconCircleSelected: {
    backgroundColor: Colors.white,
  },
  iconCircleUnselected: {
    backgroundColor: Colors.background,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelSelected: {
    color: Colors.white,
  },
  labelUnselected: {
    color: Colors.primaryDark,
  },
});

export default CategoryChip;
