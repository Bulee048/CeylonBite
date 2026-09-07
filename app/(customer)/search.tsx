import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import AppInput from '../../components/ui/AppInput';
import FoodCard from '../../components/food/FoodCard';
import EmptyState from '../../components/ui/EmptyState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { FoodItem } from '../../types';
import { mockCategories } from '../../data/mockData';
import { useAdminMenuStore } from '../../store/adminMenuStore';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState(['Burger', 'Spicy Chicken', 'Kottu', 'Pizza']);

  const foods = useAdminMenuStore((state) => state.foods);

  const handleClearRecent = () => {
    setRecentSearches([]);
  };

  const filteredItems = foods.filter((item) => {
    const matchesCategory = selectedCategory ? item.categoryId === selectedCategory : true;
    const q = query.toLowerCase().trim();

    if (!q) return matchesCategory;

    const matchesName = item.name.toLowerCase().includes(q);
    const matchesDesc = item.description.toLowerCase().includes(q);
    const matchesCatName = item.categoryId.toLowerCase().includes(q);

    return matchesCategory && (matchesName || matchesDesc || matchesCatName);
  });

  const handleItemPress = (item: FoodItem) => {
    if (query.trim() && !recentSearches.includes(query.trim())) {
      setRecentSearches([query.trim(), ...recentSearches.slice(0, 4)]);
    }
    router.push({
      pathname: '/food/[id]' as any,
      params: { id: item.id },
    });
  };

  return (
    <ScreenContainer scrollable={false} hasPadding={false}>
      <View style={styles.headerPadding}>
        <Header title="Find Your Craving" subtitle="Search CeylonBite meals & offers" />

        <AppInput
          placeholder="Search burgers, chicken, rice..."
          value={query}
          onChangeText={setQuery}
          leftIcon="search-outline"
          autoFocus
        />

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {mockCategories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(isActive ? null : cat.id)}
              >
                <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Recent Searches Chips */}
        {query.length === 0 && recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={handleClearRecent}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chipsRow}>
              {recentSearches.map((term, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.recentChip}
                  onPress={() => setQuery(term)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="time-outline" size={14} color={Colors.secondaryText} style={{ marginRight: 4 }} />
                  <Text style={styles.recentChipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Results or Empty State */}
      {filteredItems.length === 0 ? (
        <EmptyState
          iconName="search-outline"
          title="No meals found"
          description={`We couldn't find any food items matching "${query || 'selected filter'}". Try searching for 'Burger' or 'Chicken'.`}
        />
      ) : (
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
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerPadding: {
    paddingHorizontal: Spacing.md,
  },
  categoryScroll: {
    marginBottom: Spacing.sm,
  },
  categoryContent: {
    gap: Spacing.xs,
    paddingRight: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryOrange,
    borderColor: Colors.primaryOrange,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  categoryChipTextActive: {
    color: Colors.card,
  },
  recentSection: {
    marginBottom: Spacing.sm,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryOrange,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md - 2,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: 110,
  },
});
