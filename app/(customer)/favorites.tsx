import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import FoodCard from '../../components/food/FoodCard';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import Spacing from '../../constants/spacing';
import { FoodItem } from '../../types';
import { favoriteService } from '../../services/favoriteService';
import { menuService } from '../../services/menuService';
import { useFavoritesStore } from '../../store/favoritesStore';

export default function FavoritesScreen() {
  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Single source of truth shared with FoodCard hearts.
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds);
  const setFavoriteIds = useFavoritesStore((state) => state.setFavoriteIds);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [favIds, foods] = await Promise.all([
        favoriteService.getUserFavorites(),
        menuService.getFoods(),
      ]);
      // Keep the global store in sync so hearts everywhere agree with this list.
      setFavoriteIds(favIds);
      setAllFoods(foods);
    } catch (err: any) {
      setError(err?.message || 'Could not load your favorites right now.');
    } finally {
      setLoading(false);
    }
  }, [setFavoriteIds]);

  // Derive the visible list from the shared store, so un-hearting an item
  // removes it from this screen immediately.
  const favoriteItems = allFoods.filter((item) => favoriteIds.includes(item.id));

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

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

      {loading ? (
        <LoadingState message="Loading your favorites..." />
      ) : error ? (
        <EmptyState
          iconName="cloud-offline-outline"
          title="Could Not Load Favorites"
          description={error}
          buttonTitle="Retry"
          onButtonPress={loadFavorites}
        />
      ) : favoriteItems.length === 0 ? (
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
