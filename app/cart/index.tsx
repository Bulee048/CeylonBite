import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import AppButton from '../../components/ui/AppButton';
import EmptyState from '../../components/ui/EmptyState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { useCartStore } from '../../store/cartStore';

export default function CartScreen() {
  const {
    items,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    getSubtotal,
  } = useCartStore();

  const subtotal = getSubtotal();
  const deliveryFee = subtotal > 0 ? 350 : 0;
  const grandTotal = subtotal + deliveryFee;

  return (
    <View style={styles.mainContainer}>
      <ScreenContainer scrollable={false} hasPadding={false}>
        <View style={styles.headerPadding}>
          <Header title="My Cart" subtitle="Review & checkout your CeylonBite order" showBack />
        </View>

        {items.length === 0 ? (
          <EmptyState
            iconName="cart-outline"
            title="Your cart is empty"
            description="Add something delicious from our Sri Lankan fast food menu."
            buttonTitle="Browse Menu"
            onButtonPress={() => router.replace('/(customer)/menu')}
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const lineTotal = item.unitTotal * item.quantity;
              const extrasSummary = item.extras.map((e) => e.name).join(', ');

              return (
                <View style={styles.cartCard}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.foodImage}
                    contentFit="cover"
                  />

                  <View style={styles.itemInfo}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.foodName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeItem(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                      </TouchableOpacity>
                    </View>

                    {/* Customization Details */}
                    <Text style={styles.spiceTag}>{item.selectedSpice}</Text>
                    {extrasSummary.length > 0 && (
                      <Text style={styles.extrasText} numberOfLines={1}>
                        + {extrasSummary}
                      </Text>
                    )}

                    {item.specialInstructions ? (
                      <Text style={styles.instructionsText} numberOfLines={1}>
                        Note: "{item.specialInstructions}"
                      </Text>
                    ) : null}

                    {/* Quantity Stepper & Line Price */}
                    <View style={styles.cardFooterRow}>
                      <View style={styles.stepperRow}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => decreaseQuantity(item.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="remove" size={15} color={Colors.primaryDark} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => increaseQuantity(item.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add" size={15} color={Colors.primaryDark} />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.linePriceText}>
                        LKR {lineTotal.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </ScreenContainer>

      {/* Pricing Breakdown & Sticky Checkout Bar */}
      {items.length > 0 && (
        <SafeAreaView style={styles.stickySummaryBar} edges={['bottom']}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryVal}>LKR {subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryVal}>LKR {deliveryFee.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.checkoutBarRow}>
              <View style={styles.totalPriceCol}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.grandTotalText}>LKR {grandTotal.toLocaleString()}</Text>
              </View>

              <AppButton
                title="Proceed to Checkout"
                onPress={() => router.push('/checkout')}
                size="medium"
                fullWidth={false}
                style={styles.checkoutBtn}
              />
            </View>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerPadding: {
    paddingHorizontal: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: 190, // Generous padding so sticky checkout card never covers bottom item
  },

  // Cart Item Card
  cartCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md - 2,
    justifyContent: 'space-between',
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
    flex: 1,
    marginRight: 4,
  },
  spiceTag: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 1,
  },
  extrasText: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  instructionsText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: Colors.secondaryText,
    marginTop: 2,
  },

  // Card Footer Row
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs + 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
    paddingHorizontal: 8,
  },
  linePriceText: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primaryDark,
  },

  // Sticky Summary Bar
  stickySummaryBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  summaryContainer: {
    paddingHorizontal: Spacing.md + 2,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.secondaryText,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs + 2,
  },
  checkoutBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalPriceCol: {
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  grandTotalText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 1,
  },
  checkoutBtn: {
    minWidth: 170,
  },
});
