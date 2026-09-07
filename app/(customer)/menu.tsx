import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { router } from 'expo-router';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import CategoryChip from '../../components/food/CategoryChip';
import FoodCard from '../../components/food/FoodCard';
import LoadingState from '../../components/ui/LoadingState';
import Spacing from '../../constants/spacing';
import { FoodItem, Category } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { menuService } from '../../services/menuService';

export default function MenuScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  const cartCount = useCartStore((state) => state.getItemCount());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [fetchedCategories, fetchedFoods] = await Promise.all([
      menuService.getCategories(),
      menuService.getFoods(),
    ]);
    const cleanCategories = fetchedCategories.filter((c) => c.id !== 'all');
    setCategories([{ id: 'all', name: 'All', iconName: 'restaurant-outline' }, ...cleanCategories]);
    setFoods(fetchedFoods);
    setLoading(false);
  };

  const filteredItems = foods.filter(
    (item) => selectedCategory === 'all' || item.categoryId === selectedCategory
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
          title="CeylonBite Menu"
          subtitle="Explore our Sri Lankan fast food range"
          rightActionIcon="cart-outline"
          badgeCount={cartCount}
          onRightAction={() => router.push('/cart')}
        />
      </View>

      {/* Category Scroll Selector */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryBar}
        >
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              isSelected={selectedCategory === cat.id}
              onPress={() => setSelectedCategory(cat.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Menu Items List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <FoodCard
            item={item}
            variant="horizontal"
            onPress={() => handleItemPress(item)}
            onAddToCart={() => handleItemPress(item)}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerPadding: {
    paddingHorizontal: Spacing.md,
  },
  categoryContainer: {
    marginBottom: Spacing.xs,
  },
  categoryBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: 110, // Sufficient bottom clearance for fixed tab bar
  },
});
