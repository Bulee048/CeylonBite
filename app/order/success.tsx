import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenContainer from '../../components/ui/ScreenContainer';
import AppButton from '../../components/ui/AppButton';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { useCartStore } from '../../store/cartStore';

export default function OrderSuccessScreen() {
  const {
    orderNumber = 'CB1025',
    orderType = 'Delivery',
    total = '4,230',
    estimatedTime = '25–30 min',
  } = useLocalSearchParams<{
    orderNumber?: string;
    orderType?: string;
    total?: string;
    estimatedTime?: string;
  }>();

  const clearCart = useCartStore((state) => state.clearCart);

  // Clear cart safely when order success screen opens
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenContainer scrollable contentContainerStyle={styles.container}>
        {/* Animated Checkmark Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
        </View>

        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your CeylonBite order has been placed successfully.
        </Text>

        {/* Order Details Summary Card */}
        <View style={styles.orderCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Order Number</Text>
            <Text style={styles.orderNumText}>#{orderNumber}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Order Type</Text>
            <Text style={styles.valText}>{orderType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estimated Time</Text>
            <Text style={styles.timeValText}>{estimatedTime}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValText}>LKR {total}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <AppButton
            title="Track Order"
            onPress={() => router.replace({ pathname: '/order/[id]' as any, params: { id: orderNumber } })}
            size="large"
            style={styles.actionBtn}
          />
          <AppButton
            title="Back to Home"
            onPress={() => router.replace('/(customer)/home')}
            size="medium"
            variant="outline"
            style={styles.actionBtn}
          />
        </View>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primaryDark,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  orderCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  orderNumText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  valText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  timeValText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  totalValText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  buttonGroup: {
    width: '100%',
    gap: Spacing.md,
  },
  actionBtn: {
    width: '100%',
  },
});
