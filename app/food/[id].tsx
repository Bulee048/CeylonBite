import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../../components/ui/EmptyState';
import AppButton from '../../components/ui/AppButton';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { mockFoodItems } from '../../data/mockData';
import { useCartStore, ExtraItem } from '../../store/cartStore';

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const addItemToCart = useCartStore((state) => state.addItem);

  // Find target food item from mockData
  const item = mockFoodItems.find((f) => f.id === id);

  // Local React state for options & quantity
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSpice, setSelectedSpice] = useState<'Mild' | 'Ceylon Spicy' | 'Extra Hot'>('Ceylon Spicy');
  const [selectedExtras, setSelectedExtras] = useState<string[]>(['ex-1']); // default Extra Cheese
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Available extras mock data
  const extrasList: ExtraItem[] = [
    { id: 'ex-1', name: 'Extra Cheese', price: 250 },
    { id: 'ex-2', name: 'Extra Chicken', price: 450 },
    { id: 'ex-3', name: 'Signature Sauce', price: 150 },
  ];

  const spiceOptions: ('Mild' | 'Ceylon Spicy' | 'Extra Hot')[] = [
    'Mild',
    'Ceylon Spicy',
    'Extra Hot',
  ];

  // Safe fallback if invalid ID is provided
  if (!item) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          iconName="restaurant-outline"
          title="Food Item Not Found"
          description="We couldn't find the requested meal. Please explore our full menu."
          buttonTitle="Back to Menu"
          onButtonPress={() => router.replace('/(customer)/menu')}
        />
      </SafeAreaView>
    );
  }

  // Toggle extra check/uncheck
  const toggleExtra = (extraId: string) => {
    if (selectedExtras.includes(extraId)) {
      setSelectedExtras(selectedExtras.filter((eId) => eId !== extraId));
    } else {
      setSelectedExtras([...selectedExtras, extraId]);
    }
  };

  // Selected extra items
  const activeExtras = extrasList.filter((e) => selectedExtras.includes(e.id));

  // Calculate live total price: (item price + selected extras) * quantity
  const extrasTotal = activeExtras.reduce((sum, e) => sum + e.price, 0);
  const unitTotal = item.price + extrasTotal;
  const totalPrice = unitTotal * quantity;

  const handleAddToCart = () => {
    // Add item to Zustand cart store
    addItemToCart({
      foodId: item.id,
      name: item.name,
      image: item.image,
      basePrice: item.price,
      quantity,
      selectedSpice,
      extras: activeExtras,
      specialInstructions,
      unitTotal,
    });

    // Navigate to Cart screen
    router.push('/cart');
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Image Header Area */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          {/* Top Floating Action Buttons */}
          <SafeAreaView style={styles.imageOverlayHeader} edges={['top']}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.primaryDark} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => setIsFavorite(!isFavorite)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? Colors.error : Colors.primaryDark}
              />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Main Product Info Section */}
        <View style={styles.detailsContainer}>
          <Text style={styles.foodTitle}>{item.name}</Text>

          {/* Compact Metadata Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="star" size={13} color={Colors.starYellow} />
              <Text style={styles.metaBadgeText}>{item.rating}</Text>
            </View>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.metaText}>{item.prepTime || '15–20 min'}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.availableText}>
              {item.isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </View>

          {/* Orange Price Tag */}
          <Text style={styles.priceTag}>LKR {item.price.toLocaleString()}</Text>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionHeaderTitle}>Description</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>

          <View style={styles.divider} />

          {/* Quantity Stepper */}
          <View style={styles.stepperSection}>
            <Text style={styles.sectionHeaderTitle}>Quantity</Text>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                activeOpacity={0.8}
              >
                <Ionicons name="remove" size={18} color={Colors.primaryDark} />
              </TouchableOpacity>
              <Text style={styles.quantityDisplay}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => setQuantity(quantity + 1)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color={Colors.primaryDark} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Customization: Make It Yours */}
          <Text style={styles.mainSectionHeading}>Make It Yours</Text>

          {/* Spice Selection (Single choice radio) */}
          <View style={styles.customGroup}>
            <Text style={styles.subSectionTitle}>Choose Your Spice</Text>
            {spiceOptions.map((spice) => {
              const isSelected = selectedSpice === spice;
              return (
                <TouchableOpacity
                  key={spice}
                  style={[styles.radioRow, isSelected && styles.radioRowSelected]}
                  onPress={() => setSelectedSpice(spice)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {spice}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add Extras (Multiple choice checkboxes) */}
          <View style={styles.customGroup}>
            <Text style={styles.subSectionTitle}>Add Extras</Text>
            {extrasList.map((extra) => {
              const isChecked = selectedExtras.includes(extra.id);
              return (
                <TouchableOpacity
                  key={extra.id}
                  style={[styles.checkboxRow, isChecked && styles.checkboxRowSelected]}
                  onPress={() => toggleExtra(extra.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxSelected]}>
                    {isChecked && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                  </View>
                  <Text style={[styles.optionLabel, isChecked && styles.optionLabelSelected]}>
                    {extra.name}
                  </Text>
                  <Text style={styles.extraPriceText}>+ LKR {extra.price}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Special Instructions Input */}
          <Text style={styles.subSectionTitle}>Special Instructions</Text>
          <TextInput
            style={styles.multilineInput}
            placeholder="Anything we should know? (e.g. No onions, less spicy)"
            placeholderTextColor={Colors.secondaryText}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <SafeAreaView style={styles.stickyBottomBar} edges={['bottom']}>
        <View style={styles.stickyBarContent}>
          <View style={styles.priceColumn}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalAmountText}>LKR {totalPrice.toLocaleString()}</Text>
          </View>

          <AppButton
            title="Add to Cart"
            onPress={handleAddToCart}
            size="medium"
            fullWidth={false}
            style={styles.addToCartButton}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },

  // Hero Image
  imageContainer: {
    width: '100%',
    height: 270,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  imageOverlayHeader: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  // Product Info
  detailsContainer: {
    paddingHorizontal: Spacing.md + 2,
    paddingTop: Spacing.md,
  },
  foodTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primaryDark,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightOrange,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginLeft: 4,
  },
  dotSeparator: {
    marginHorizontal: 8,
    color: Colors.secondaryText,
    fontSize: 12,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  availableText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
  priceTag: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.secondaryText,
    lineHeight: 22,
  },

  // Stepper
  stepperSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplay: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    paddingHorizontal: Spacing.md,
  },

  // Customization: Make It Yours
  mainSectionHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primaryDark,
    marginBottom: Spacing.md,
  },
  customGroup: {
    marginBottom: Spacing.md,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: Spacing.xs + 2,
  },

  // Spice Radio Buttons
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md - 2,
    marginBottom: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radioRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightOrange,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.secondaryText,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm + 2,
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  // Extra Checkboxes
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md - 2,
    marginBottom: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkboxRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightOrange,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.secondaryText,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm + 2,
  },
  checkboxBoxSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  optionLabelSelected: {
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  extraPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Multiline Input
  multilineInput: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.primaryDark,
    minHeight: 80,
  },

  // Sticky Bottom Bar
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  stickyBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 2,
  },
  priceColumn: {
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  totalAmountText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 1,
  },
  addToCartButton: {
    minWidth: 150,
  },
});
