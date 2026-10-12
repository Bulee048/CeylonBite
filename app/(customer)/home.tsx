import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenContainer from '../../components/ui/ScreenContainer';
import SectionHeader from '../../components/ui/SectionHeader';
import CategoryChip from '../../components/food/CategoryChip';
import FoodCard from '../../components/food/FoodCard';
import AppButton from '../../components/ui/AppButton';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { FoodItem, Category } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { menuService } from '../../services/menuService';
import { useFavoritesStore } from '../../store/favoritesStore';

const logoImg = require('../../assets/images/logo.png');

import { useFocusEffect } from 'expo-router';

export default function CustomerHomeScreen() {
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cartCount = useCartStore((state) => state.getItemCount());
  const cartHydrated = useCartStore((state) => state.hasHydrated);
  const profile = useAuthStore((state) => state.profile);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedCategories, fetchedFoods] = await Promise.all([
        menuService.getCategories(),
        menuService.getFoods(),
      ]);
      const cleanCategories = fetchedCategories.filter((c) => c.id !== 'all');
      setCategories([{ id: 'all', name: 'All', iconName: 'restaurant-outline' }, ...cleanCategories]);
      setFoods(fetchedFoods);
    } catch (err: any) {
      setError(err?.message || 'Could not load the restaurant menu. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFavorites = useFavoritesStore((state) => state.loadFavorites);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
      loadFavorites(); // Sync favorites on each focus
    }, [loadData, loadFavorites])
  );

  const popularItems = foods.filter((item) => item.isPopular);
  const recommendedItems = foods.filter((item) =>
    selectedCategoryId === 'all' ? true : item.categoryId === selectedCategoryId
  );

  const handleFoodPress = (item: FoodItem) => {
    router.push({
      pathname: '/food/[id]' as any,
      params: { id: item.id },
    });
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'You have no new order notifications right now.');
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      {/* Top Header Section */}
      <View style={styles.topHeader}>
        <View style={styles.headerBrandRow}>
          <Image
            source={logoImg}
            style={styles.headerLogo}
            contentFit="contain"
          />
          <View style={styles.userInfo}>
            <Text style={styles.userNameText}>CeylonBite</Text>
            <TouchableOpacity style={styles.locationContainer} activeOpacity={0.7}>
              <Ionicons name="location-outline" size={13} color={Colors.primary} />
              <Text style={styles.locationText}>{profile?.address || 'Colombo, Sri Lanka'}</Text>
              <Ionicons name="chevron-down" size={12} color={Colors.secondaryText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Circular Top Right Cart Button */}
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => router.push('/cart')}
          activeOpacity={0.8}
        >
          <Ionicons name="cart-outline" size={22} color={Colors.primaryDark} />
          {cartHydrated && cartCount > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          ) : (
            <View style={styles.notificationDot} />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar & Separate Filter Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search CeylonBite"
            placeholderTextColor={Colors.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => router.push('/(customer)/search')}
          />
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => router.push('/(customer)/search')}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Menu Load Error */}
      {error && foods.length === 0 ? (
        <EmptyState
          iconName="cloud-offline-outline"
          title="Could Not Load Menu"
          description={`${error}\n\nMake sure the server is reachable, then retry.`}
          buttonTitle="Retry"
          onButtonPress={loadData}
        />
      ) : null}

      {/* Categories Horizontal Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {categories.map((cat) => (
          <CategoryChip
            key={cat.id}
            category={cat}
            isSelected={selectedCategoryId === cat.id}
            onPress={() => setSelectedCategoryId(cat.id)}
          />
        ))}
      </ScrollView>

      {/* Hero Promotional Banner */}
      <View style={styles.promoBanner}>
        <View style={styles.promoLeft}>
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>CEYLONBITE SPECIAL</Text>
          </View>
          <Text style={styles.promoTitle}>Up to 20% off on selected meals</Text>
          <Text style={styles.promoSub}>Sri Lankan spices, iconic crunch.</Text>
          <AppButton
            title="Order Now"
            onPress={() => router.push('/(customer)/menu')}
            size="small"
            fullWidth={false}
            style={styles.promoBtn}
          />
        </View>

        <View style={styles.promoRight}>
          <Image
            source={{ uri: foods[1]?.image || 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=800' }}
            style={styles.bannerFoodImage}
            contentFit="cover"
          />
        </View>
      </View>

      {/* Popular Section */}
      <SectionHeader
        title="Popular Right Now"
        subtitle="Most ordered meals this week"
        actionText="See All"
        onActionPress={() => router.push('/(customer)/menu')}
      />
      <FlatList
        data={popularItems}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FoodCard
            item={item}
            onPress={() => handleFoodPress(item)}
            onAddToCart={() => handleFoodPress(item)}
          />
        )}
        contentContainerStyle={styles.foodListContainer}
      />

      {/* Recommended Section */}
      <SectionHeader
        title="Recommended For You"
        subtitle="Handpicked Sri Lankan favorites"
      />
      <View style={styles.recommendedList}>
        {recommendedItems.map((item) => (
          <FoodCard
            key={item.id}
            item={item}
            variant="horizontal"
            onPress={() => handleFoodPress(item)}
            onAddToCart={() => handleFoodPress(item)}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.xs,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  headerLogo: {
    width: 44,
    height: 44,
    marginRight: Spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryDark,
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginHorizontal: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },

  // Search Row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    height: 52,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 15,
    color: Colors.primaryDark,
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Categories Scroll
  categoriesScroll: {
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },

  // Hero Banner
  promoBanner: {
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.xl,
    padding: Spacing.md + 2,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  promoLeft: {
    flex: 1.2,
    alignItems: 'flex-start',
    marginRight: Spacing.sm,
  },
  promoBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginBottom: Spacing.xs,
  },
  promoBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginVertical: 4,
    lineHeight: 22,
  },
  promoSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: Spacing.md,
  },
  promoBtn: {
    minWidth: 110,
  },
  promoRight: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bannerFoodImage: {
    width: '100%',
    height: '100%',
  },

  // Food List
  foodListContainer: {
    paddingBottom: Spacing.xs,
  },
  recommendedList: {
    marginTop: Spacing.xs,
  },
});
