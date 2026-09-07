import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, GestureResponderEvent } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { FoodItem } from '../../types';
import Colors from '../../constants/colors';
import Radius from '../../constants/radius';
import Spacing from '../../constants/spacing';
import { useFavoritesStore } from '../../store/favoritesStore';

interface FoodCardProps {
  item: FoodItem;
  onPress: () => void;
  onAddToCart?: () => void;
  variant?: 'card' | 'horizontal';
  style?: ViewStyle;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  onPress,
  onAddToCart,
  variant = 'card',
  style,
}) => {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const favorite = isFavorite(item.id);

  const formattedPrice = `LKR ${item.price.toLocaleString()}`;

  const handleFavoritePress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    toggleFavorite(item.id);
  };

  const handleAddPress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart();
    } else {
      onPress();
    }
  };

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.horizontalCard, style]}
      >
        <View style={styles.horizontalImageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.horizontalImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.ratingBadgeOverlay}>
            <Ionicons name="star" size={11} color={Colors.starYellow} />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>

        <View style={styles.horizontalContent}>
          <View style={styles.horizontalHeaderRow}>
            <Text style={styles.foodName} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity
              onPress={handleFavoritePress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={18}
                color={favorite ? Colors.error : Colors.secondaryText}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.horizontalFooterRow}>
            <Text style={styles.priceText} numberOfLines={1}>
              {formattedPrice}
            </Text>
            <TouchableOpacity
              style={styles.smallAddButton}
              onPress={handleAddPress}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, style]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={15}
            color={favorite ? Colors.error : Colors.primaryDark}
          />
        </TouchableOpacity>
        <View style={styles.ratingBadgeOverlay}>
          <Ionicons name="star" size={11} color={Colors.starYellow} />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.foodName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceText} numberOfLines={1}>
            {formattedPrice}
          </Text>
          <TouchableOpacity
            style={styles.smallAddButton}
            onPress={handleAddPress}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 180,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    marginRight: Spacing.md - 4,
    marginBottom: Spacing.sm,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    backgroundColor: Colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ratingBadgeOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(23, 20, 18, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    marginLeft: 3,
  },
  contentContainer: {
    padding: Spacing.sm + 2,
    flex: 1,
    justifyContent: 'space-between',
  },
  foodName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 2,
    lineHeight: 18,
  },
  descriptionText: {
    fontSize: 11,
    color: Colors.secondaryText,
    lineHeight: 15,
    marginBottom: Spacing.xs + 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    flex: 1,
    marginRight: 4,
  },
  smallAddButton: {
    backgroundColor: Colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  horizontalImageContainer: {
    width: 95,
    height: 95,
    borderRadius: Radius.md,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
  },
  horizontalContent: {
    flex: 1,
    marginLeft: Spacing.sm + 4,
    justifyContent: 'space-between',
  },
  horizontalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horizontalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
});

export default FoodCard;
