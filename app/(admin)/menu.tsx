import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import EmptyState from '../../components/ui/EmptyState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { mockCategories } from '../../data/mockData';
import { useAdminMenuStore } from '../../store/adminMenuStore';

export default function AdminMenuScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  const foods = useAdminMenuStore((state) => state.foods);
  const toggleAvailability = useAdminMenuStore((state) => state.toggleAvailability);
  const deleteFood = useAdminMenuStore((state) => state.deleteFood);

  const filteredFoods = foods.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase()) || item.description.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategory ? item.categoryId === selectedCategory : true;
    const matchesAvailability =
      availabilityFilter === 'all'
        ? true
        : availabilityFilter === 'available'
        ? item.isAvailable
        : !item.isAvailable;

    return matchesQuery && matchesCategory && matchesAvailability;
  });

  return (
    <ScreenContainer scrollable={false} hasPadding={false}>
      <View style={styles.headerPadding}>
        <Header title="Menu Management" subtitle="Add, edit, or disable restaurant meals" showBack />

        <AppButton
          title="+ Add New Food Item"
          onPress={() => router.push('/admin-food/add' as any)}
          style={styles.addBtn}
        />

        <AppInput
          placeholder="Search food by name..."
          value={query}
          onChangeText={setQuery}
          leftIcon="search-outline"
        />

        {/* Category & Availability Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.chip, !selectedCategory && styles.chipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All Categories</Text>
          </TouchableOpacity>
          {mockCategories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedCategory(isActive ? null : cat.id)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {filteredFoods.length === 0 ? (
        <EmptyState
          iconName="restaurant-outline"
          title="No Food Items"
          description="No items match your selected filters."
        />
      ) : (
        <FlatList
          data={filteredFoods}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.foodImg} resizeMode="cover" />
              <View style={styles.infoCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.foodName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={[styles.badge, item.isAvailable ? styles.bgAvailable : styles.bgUnavailable]}>
                    <Text style={[styles.badgeText, item.isAvailable ? styles.txAvailable : styles.txUnavailable]}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.category}>{item.categoryId.toUpperCase()}</Text>
                <Text style={styles.price}>LKR {item.price.toLocaleString()}</Text>
              </View>

              <View style={styles.actionCol}>
                <TouchableOpacity
                  style={[styles.iconBtn, item.isAvailable && styles.activeToggleBtn]}
                  onPress={() => toggleAvailability(item.id)}
                >
                  <Ionicons
                    name={item.isAvailable ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={item.isAvailable ? Colors.primaryOrange : Colors.secondaryText}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => router.push({ pathname: '/admin-food/[id]' as any, params: { id: item.id } })}
                >
                  <Ionicons name="create-outline" size={18} color={Colors.primaryDark} />
                </TouchableOpacity>
              </View>
            </View>
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
  addBtn: {
    marginBottom: Spacing.xs,
  },
  filterScroll: {
    marginBottom: Spacing.sm,
  },
  filterContent: {
    gap: Spacing.xs,
    paddingRight: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryOrange,
    borderColor: Colors.primaryOrange,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  chipTextActive: {
    color: Colors.card,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: 110,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  foodImg: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    marginRight: Spacing.sm,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: Spacing.xs,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
    flex: 1,
    marginRight: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  bgAvailable: {
    backgroundColor: '#DCFCE7',
  },
  bgUnavailable: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  txAvailable: {
    color: Colors.success,
  },
  txUnavailable: {
    color: Colors.error,
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryText,
    marginVertical: 1,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryOrange,
  },
  actionCol: {
    flexDirection: 'row',
    gap: Spacing.xs - 2,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeToggleBtn: {
    backgroundColor: Colors.lightOrange,
    borderColor: Colors.primaryOrange,
  },
});
