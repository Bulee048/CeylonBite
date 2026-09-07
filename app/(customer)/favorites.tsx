import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import FoodCard from '../../components/food/FoodCard';
import EmptyState from '../../components/ui/EmptyState';
import Spacing from '../../constants/spacing';
import { FoodItem } from '../../types';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useAdminMenuStore } from '../../store/adminMenuStore';

export default function FavoritesScreen() {
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds);
  const foods = useAdminMenuStore((state) => state.foods);

  const favoriteItems = foods.filter((item) => favoriteIds.includes(item.id));

  const handleItemPress = (item: FoodItem) => {
    router.push({
      pathname: '/food/[id]' as any,
      params: { id: item.id },
    });
  };

  return (
    <ScreenContainer scrollable={false} hasPadding={false}>
      <View style={styles.headerPadding}>
        <Header
          title="Favorite Meals"
          subtitle="Your saved CeylonBite favorites"
          showBack
        />
      </View>

      {favoriteItems.length === 0 ? (
        <EmptyState
          iconName="heart-outline"
          title="No Favorites Yet"
          description="Tap the heart icon on any food item to save it here for quick ordering."
          buttonTitle="Explore Menu"
          onButtonPress={() => router.push('/(customer)/menu')}
        />
      ) : (
        <FlatList
          data={favoriteItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <FoodCard
              item={item}
              variant="horizontal"
              onPress={() => handleItemPress(item)}
              onAddToCart={() => handleItemPress(item)}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerPadding: {
    paddingHorizontal: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
});
