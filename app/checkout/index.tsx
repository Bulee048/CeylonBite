import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import AppButton from '../../components/ui/AppButton';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { orderService } from '../../services/orderService';

import { api } from '../../services/api';
import { isValidSriLankanPhone, toCanonicalPhone } from '../../utils';

export default function CheckoutScreen() {
  const { items, getSubtotal, clearCart, hasHydrated } = useCartStore();
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  // Guards against duplicate submissions triggered by rapid taps (React state
  // updates are async, so a boolean ref is the reliable lock).
  const submittingRef = useRef(false);

  // Editable customer info initialized from logged-in user profile
  const [customerName, setCustomerName] = useState(profile?.fullName || user?.fullName || 'Valued Diner');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(profile?.address || '');

  // Local state options
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [orderTimeMode, setOrderTimeMode] = useState<'asap' | 'schedule'>('asap');
  const [scheduledTime, setScheduledTime] = useState<string>('7:00 PM');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'wallet'>('cod');
  
  // Promo code API state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedDiscountAmount, setAppliedDiscountAmount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | undefined>(undefined);
  const [promoStatus, setPromoStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  // Delivery instructions
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Calculations
  const subtotal = getSubtotal();
  const deliveryFee = orderType === 'delivery' ? (subtotal > 0 ? 350 : 0) : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - appliedDiscountAmount);

  // The backend recomputes the discount from the authoritative subtotal at order
  // time. If the cart subtotal changes after a promo was applied, the locally
  // displayed discount can go stale, so clear it and ask the user to re-apply.
  // This keeps the displayed total consistent with the server-calculated total.
  const prevSubtotalRef = useRef(subtotal);
  useEffect(() => {
    if (prevSubtotalRef.current !== subtotal) {
      prevSubtotalRef.current = subtotal;
      if (appliedPromoCode) {
        setAppliedDiscountAmount(0);
        setAppliedPromoCode(undefined);
        setPromoStatus({
          message: 'Cart total changed — please re-apply your promo code.',
          isError: true,
        });
      }
    }
  }, [subtotal, appliedPromoCode]);

  const scheduleTimeOptions = ['6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM'];

  // Apply promo code handler calling backend API
  const handleApplyPromo = async () => {
    if (promoLoading) return;
    const cleanCode = promoCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setAppliedDiscountAmount(0);
      setAppliedPromoCode(undefined);
      setPromoStatus(null);
      return;
    }

    setPromoLoading(true);
    setPromoStatus(null);
    const res = await api.post('/promo/validate', { code: cleanCode, subtotal });
    setPromoLoading(false);
    if (res.success && res.data) {
      setAppliedDiscountAmount(res.data.discountAmount);
      setAppliedPromoCode(res.data.promoCode);
      setPromoStatus({ message: `Promo "${res.data.promoCode}" applied! Discount: LKR ${res.data.discountAmount}`, isError: false });
    } else {
      setAppliedDiscountAmount(0);
      setAppliedPromoCode(undefined);
      setPromoStatus({ message: res.message || 'Invalid promo code', isError: true });
    }
  };

  // Place order handler
  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    // Hard guard against duplicate submissions (e.g. rapid double-tap).
    if (submittingRef.current || loading) return;

    if (orderType === 'delivery') {
      if (!customerPhone.trim()) {
        Alert.alert('Validation Error', 'Phone number is required for delivery.');
        return;
      }
      if (!isValidSriLankanPhone(customerPhone)) {
        Alert.alert('Validation Error', 'Please enter a valid Sri Lankan phone number (+94XXXXXXXXX or 07XXXXXXXX).');
        return;
      }
      if (!deliveryAddress.trim()) {
        Alert.alert('Validation Error', 'Delivery address is required.');
        return;
      }
    }

    const estTime = orderType === 'delivery' ? '25–30 min' : '15–20 min';
    const mappedPayment = paymentMethod === 'cod' ? 'cash' : paymentMethod === 'card' ? 'card' : 'wallet';

    submittingRef.current = true;
    setLoading(true);

    let result: Awaited<ReturnType<typeof orderService.createOrder>> = {
      orderId: null,
      orderNumber: null,
      subtotal: null,
      deliveryFee: null,
      discount: null,
      total: null,
      promoCode: null,
      error: 'Order was not submitted.',
    };
    try {
      result = await orderService.createOrder({
        userId: user?.id || profile?.id || 1,
        customerName: customerName.trim() || 'Valued Diner',
        customerPhone: toCanonicalPhone(customerPhone),
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : 'Store Pickup: Colombo 03 Branch',
        deliveryInstructions,
        orderType,
        paymentMethod: mappedPayment,
        promoCode: appliedPromoCode,
        items,
        subtotal,
        deliveryFee,
        discount: appliedDiscountAmount,
        total: grandTotal,
      });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }

    const { orderNumber, error } = result;

    // Only clear the cart / navigate AFTER the server has confirmed the order.
    // On any failure the cart is left intact so the user can retry.
    if (error || !orderNumber) {
      Alert.alert('Order Failed', error || 'Failed to place order.');
      return;
    }

    clearCart();

    // The backend is authoritative for billing. If the current DB price differed
    // from the cart's estimate, show the server's real total (never the stale
    // local one) and flag the adjustment on the confirmation screen.
    const serverTotal = result.total !== null ? result.total : grandTotal;
    const priceAdjusted =
      result.total !== null && Math.abs(result.total - grandTotal) > 0.01;

    router.push({
      pathname: '/order/success' as any,
      params: {
        orderNumber,
        orderType: orderType === 'delivery' ? 'Home Delivery' : 'Store Pickup',
        total: serverTotal.toLocaleString(),
        estimatedTime: estTime,
        priceAdjusted: priceAdjusted ? 'true' : 'false',
      },
    });
  };

  // Hydration-safe: don't render the empty-cart guard (or the checkout form)
  // until the persisted cart has been restored, otherwise a returning user
  // would briefly (or permanently, if they tapped) see "Nothing to checkout".
  if (!hasHydrated) {
    return (
      <ScreenContainer scrollable={false} hasPadding={false}>
        <View style={styles.headerPadding}>
          <Header title="Checkout" subtitle="Restoring your cart..." showBack />
        </View>
        <LoadingState message="Restoring your cart..." />
      </ScreenContainer>
    );
  }

  // Empty cart protection
  if (items.length === 0) {
    return (
      <ScreenContainer scrollable={false} hasPadding={false}>
        <View style={styles.headerPadding}>
          <Header title="Checkout" subtitle="Nothing to checkout" showBack />
        </View>
        <EmptyState
          iconName="bag-handle-outline"
          title="Nothing to checkout"
          description="Your cart is currently empty. Add delicious meals from our menu."
          buttonTitle="Browse Menu"
          onButtonPress={() => router.replace('/(customer)/menu')}
        />
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScreenContainer scrollable contentContainerStyle={styles.scrollContent}>
        <Header title="Checkout" subtitle="Complete your CeylonBite order" showBack />

        {/* 1. Order Type Selection */}
        <Text style={styles.sectionHeading}>How would you like your order?</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeCard, orderType === 'delivery' && styles.typeCardSelected]}
            onPress={() => setOrderType('delivery')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="bicycle-outline"
              size={24}
              color={orderType === 'delivery' ? Colors.primary : Colors.primaryDark}
            />
            <Text style={[styles.typeText, orderType === 'delivery' && styles.typeTextSelected]}>
              Delivery
            </Text>
            <Text style={styles.typeSub}>LKR 350 Fee</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeCard, orderType === 'pickup' && styles.typeCardSelected]}
            onPress={() => setOrderType('pickup')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="storefront-outline"
              size={24}
              color={orderType === 'pickup' ? Colors.primary : Colors.primaryDark}
            />
            <Text style={[styles.typeText, orderType === 'pickup' && styles.typeTextSelected]}>
              Pickup
            </Text>
            <Text style={styles.typeSub}>Free</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Delivery Address or Pickup Location */}
        {orderType === 'delivery' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Delivery Information</Text>
            </View>
            <Text style={styles.inputLabelText}>Full Name *</Text>
            <TextInput
              style={styles.checkoutInput}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Your Full Name"
              placeholderTextColor={Colors.secondaryText}
            />
            <Text style={styles.inputLabelText}>Phone Number * (+94XXXXXXXXX)</Text>
            <TextInput
              style={styles.checkoutInput}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="e.g. +94771234567"
              keyboardType="phone-pad"
              placeholderTextColor={Colors.secondaryText}
            />
            <Text style={styles.inputLabelText}>Delivery Address *</Text>
            <TextInput
              style={styles.checkoutInput}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="House/Street/City Address"
              placeholderTextColor={Colors.secondaryText}
            />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="storefront" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Pickup Branch</Text>
            </View>
            <Text style={styles.branchName}>CeylonBite Colombo 03</Text>
            <Text style={styles.branchAddress}>No. 45 Galle Road, Colombo 03</Text>
            <Text style={styles.pickupTimeNote}>⚡ Ready in approx. 15–20 minutes</Text>
          </View>
        )}

        {/* 3. Order Timing */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Order Time</Text>
          </View>

          <View style={styles.timeModeRow}>
            <TouchableOpacity
              style={[styles.timeModeBtn, orderTimeMode === 'asap' && styles.timeModeBtnSelected]}
              onPress={() => setOrderTimeMode('asap')}
              activeOpacity={0.8}
            >
              <Text style={[styles.timeModeText, orderTimeMode === 'asap' && styles.timeModeTextSelected]}>
                ASAP (20–30 min)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timeModeBtn, orderTimeMode === 'schedule' && styles.timeModeBtnSelected]}
              onPress={() => setOrderTimeMode('schedule')}
              activeOpacity={0.8}
            >
              <Text style={[styles.timeModeText, orderTimeMode === 'schedule' && styles.timeModeTextSelected]}>
                Schedule Time
              </Text>
            </TouchableOpacity>
          </View>

          {orderTimeMode === 'schedule' && (
            <View style={styles.scheduleChipsRow}>
              {scheduleTimeOptions.map((timeOption) => (
                <TouchableOpacity
                  key={timeOption}
                  style={[
                    styles.timeChip,
                    scheduledTime === timeOption && styles.timeChipSelected,
                  ]}
                  onPress={() => setScheduledTime(timeOption)}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      scheduledTime === timeOption && styles.timeChipTextSelected,
                    ]}
                  >
                    {timeOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 4. Payment Method Selection */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>

          <TouchableOpacity
            style={[styles.payCard, paymentMethod === 'cod' && styles.payCardSelected]}
            onPress={() => setPaymentMethod('cod')}
            activeOpacity={0.8}
          >
            <Ionicons name="cash-outline" size={20} color={Colors.primaryDark} />
            <Text style={styles.payLabel}>Cash on Delivery</Text>
            <Ionicons
              name={paymentMethod === 'cod' ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={paymentMethod === 'cod' ? Colors.primary : Colors.secondaryText}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.payCard, paymentMethod === 'card' && styles.payCardSelected]}
            onPress={() => setPaymentMethod('card')}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={20} color={Colors.primaryDark} />
            <Text style={styles.payLabel}>Credit / Debit Card</Text>
            <Ionicons
              name={paymentMethod === 'card' ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={paymentMethod === 'card' ? Colors.primary : Colors.secondaryText}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.payCard, paymentMethod === 'wallet' && styles.payCardSelected]}
            onPress={() => setPaymentMethod('wallet')}
            activeOpacity={0.8}
          >
            <Ionicons name="wallet-outline" size={20} color={Colors.primaryDark} />
            <Text style={styles.payLabel}>CeylonBite Wallet</Text>
            <Ionicons
              name={paymentMethod === 'wallet' ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={paymentMethod === 'wallet' ? Colors.primary : Colors.secondaryText}
            />
          </TouchableOpacity>

          {paymentMethod === 'card' && (
            <View style={styles.payNoteBox}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
              <Text style={styles.payNoteText}>
                Card details will be securely processed in a future payment gateway integration.
              </Text>
            </View>
          )}
        </View>

        {/* 5. Promo Code */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pricetag-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Promo Code</Text>
          </View>
          <View style={styles.promoInputRow}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter code (e.g. CEYLON20)"
              placeholderTextColor={Colors.secondaryText}
              value={promoCodeInput}
              onChangeText={setPromoCodeInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.applyBtn, promoLoading && styles.applyBtnDisabled]}
              onPress={handleApplyPromo}
              disabled={promoLoading || items.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>{promoLoading ? 'Checking...' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>

          {promoStatus && (
            <Text
              style={[
                styles.promoStatusText,
                promoStatus.isError ? styles.promoError : styles.promoSuccess,
              ]}
            >
              {promoStatus.message}
            </Text>
          )}
        </View>

        {/* 6. Items Summary Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Order ({items.length} items)</Text>
          {items.map((item: any) => (
            <View key={item.id} style={styles.orderItemRow}>
              <Image source={{ uri: item.image }} style={styles.orderItemImage} />
              <View style={styles.orderItemMeta}>
                <Text style={styles.orderItemName} numberOfLines={1}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.orderItemSub} numberOfLines={1}>
                  {item.selectedSpice}
                  {item.extras && item.extras.length > 0 ? ` • ${item.extras.map((e: any) => e.name).join(', ')}` : ''}
                </Text>
              </View>
              <Text style={styles.orderItemPrice}>
                LKR {(item.unitTotal * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* 7. Special Delivery Instructions */}
        {orderType === 'delivery' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Instructions</Text>
            <TextInput
              style={styles.instructionsInput}
              placeholder="Gate code, landmark, delivery note..."
              placeholderTextColor={Colors.secondaryText}
              value={deliveryInstructions}
              onChangeText={setDeliveryInstructions}
              multiline
              numberOfLines={2}
            />
          </View>
        )}

        {/* 8. Final Order Summary Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>LKR {subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryVal}>
              {deliveryFee > 0 ? `LKR ${deliveryFee}` : 'Free'}
            </Text>
          </View>
          {appliedDiscountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>Promo Discount</Text>
              <Text style={styles.discountVal}>- LKR {appliedDiscountAmount.toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.grandTotalVal}>LKR {grandTotal.toLocaleString()}</Text>
          </View>
        </View>
      </ScreenContainer>

      {/* Sticky Bottom Place Order Action Bar */}
      <SafeAreaView style={styles.stickyBar} edges={['bottom']}>
        <View style={styles.stickyContent}>
          <View style={styles.priceCol}>
            <Text style={styles.stickyTotalLabel}>Total Amount</Text>
            <Text style={styles.stickyTotalVal}>LKR {grandTotal.toLocaleString()}</Text>
          </View>

          <AppButton
            title={loading ? 'Placing Order...' : 'Place Order'}
            onPress={handlePlaceOrder}
            size="medium"
            fullWidth={false}
            loading={loading}
            disabled={items.length === 0 || loading}
            style={styles.placeOrderBtn}
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
  headerPadding: {
    paddingHorizontal: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 110,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginVertical: Spacing.xs + 2,
  },

  // Order Type Cards
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.md - 2,
    marginBottom: Spacing.md,
  },
  typeCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md - 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightOrange,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 4,
  },
  typeTextSelected: {
    color: Colors.primary,
  },
  typeSub: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
  },

  // Cards
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  inputLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  checkoutInput: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.primaryDark,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Address
  addressBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  addressText: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  changeBtn: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },

  // Branch Pickup
  branchName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  branchAddress: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  pickupTimeNote: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
    marginTop: 6,
  },

  // Timing Mode
  timeModeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  timeModeBtn: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeModeBtnSelected: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  timeModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  timeModeTextSelected: {
    color: Colors.white,
  },
  scheduleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  timeChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  timeChipTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },

  // Payment Option Cards
  payCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md - 2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs + 2,
  },
  payCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightOrange,
  },
  payLabel: {
    flex: 1,
    marginLeft: Spacing.sm + 2,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  payNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: 4,
    gap: 6,
  },
  payNoteText: {
    fontSize: 11,
    color: Colors.secondaryText,
    flex: 1,
    lineHeight: 15,
  },

  // Promo Code
  promoInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  promoInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.primaryDark,
    height: 44,
  },
  applyBtn: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  applyBtnDisabled: {
    opacity: 0.6,
  },
  promoStatusText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  promoSuccess: {
    color: Colors.success,
  },
  promoError: {
    color: Colors.error,
  },

  // Order Items Breakdown
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderItemImage: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
  },
  orderItemMeta: {
    flex: 1,
    marginLeft: Spacing.sm + 2,
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  orderItemSub: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },

  // Delivery Note
  instructionsInput: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm + 2,
    fontSize: 13,
    color: Colors.primaryDark,
    marginTop: 4,
  },

  // Payment Summary
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
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  discountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
  },
  discountVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs + 2,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },

  // Sticky Bottom Action Bar
  stickyBar: {
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
  stickyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 2,
  },
  priceCol: {
    justifyContent: 'center',
  },
  stickyTotalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  stickyTotalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 1,
  },
  placeOrderBtn: {
    minWidth: 160,
  },
});
