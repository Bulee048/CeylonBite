import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import AppButton from '../../components/ui/AppButton';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { OrderStatus } from '../../types';
import { TrackStatus, DetailedOrder } from '../../types';
import { useAdminOrderStore } from '../../store/adminOrderStore';
import { orderService } from '../../services/orderService';

// Mirrors the server-side lifecycle enforcement in orderController.
// Forward-only progression plus cancel; delivered/cancelled are terminal.
const ORDER_TRANSITIONS: Record<TrackStatus, TrackStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export default function AdminOrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const getOrderById = useAdminOrderStore((state) => state.getOrderById);
  const updateOrderStatus = useAdminOrderStore((state) => state.updateOrderStatus);

  const [order, setOrder] = useState<DetailedOrder | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;

      // First try the in-memory store (fast path)
      const storeOrder = getOrderById(id);
      if (storeOrder) {
        setOrder(storeOrder);
        return;
      }

      // Fallback: fetch directly from API (handles direct URL navigation / fresh load)
      setLoading(true);
      const fetchedOrder = await orderService.getOrderById(id);
      setOrder(fetchedOrder);
      setLoading(false);
    };

    loadOrder();
  }, [id]);

  if (loading || order === undefined) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Order Details" showBack />
        <LoadingState message="Loading order details..." />
      </ScreenContainer>
    );
  }

  if (!order) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Order Details" showBack />
        <EmptyState
          iconName="alert-circle-outline"
          title="Order Not Found"
          description={`No order found with ID "${id}". It may have been deleted or invalid.`}
          buttonTitle="Back to Orders"
          onButtonPress={() => router.back()}
        />
      </ScreenContainer>
    );
  }

  // Only offer the current status plus the transitions the backend will accept.
  const availableStatuses: TrackStatus[] = [
    order.status,
    ...(ORDER_TRANSITIONS[order.status] || []),
  ];

  const handleUpdateStatus = async (newStatus: TrackStatus) => {
    if (updating || newStatus === order.status) return;

    const previousStatus = order.status;
    setUpdating(true);

    // Optimistic local update
    updateOrderStatus(order.id, newStatus);
    setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);

    const { error } = await orderService.updateOrderStatus(order.id, newStatus);

    setUpdating(false);

    if (error) {
      // Revert the optimistic update and surface the real server error.
      updateOrderStatus(order.id, previousStatus);
      setOrder((prev) => prev ? { ...prev, status: previousStatus } : prev);
      Alert.alert('Status Not Updated', error);
      return;
    }

    Alert.alert('Status Updated', `Order ${order.id} is now set to "${newStatus.replace(/_/g, ' ')}".`);
  };

  const handleContactCustomer = () => {
    Alert.alert('Contact Customer', `Calling ${order.customerName || 'Customer'}...`);
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <Header title={`Order ${order.id}`} subtitle={`Placed ${order.createdAt || order.placedTime}`} showBack />

      {/* Status Overview Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusLabel}>Current Status</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{order.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        <Text style={styles.sectionSubtitle}>Quick Status Update:</Text>
        <View style={styles.statusButtonsRow}>
          {availableStatuses.map((st) => {
            const isActive = order.status === st;
            return (
              <TouchableOpacity
                key={st}
                style={[styles.statusBtn, isActive && styles.statusBtnActive]}
                onPress={() => handleUpdateStatus(st)}
                disabled={updating}
                activeOpacity={0.8}
              >
                <Text style={[styles.statusBtnText, isActive && styles.statusBtnTextActive]}>
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Customer Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="person-outline" size={18} color={Colors.primaryOrange} />
          <Text style={styles.cardHeaderTitle}>Customer Information</Text>
        </View>
        <Text style={styles.infoTextName}>{order.customerName || 'Customer'}</Text>
        <Text style={styles.infoTextSub}>{order.deliveryAddress || 'No address provided'}</Text>

        <View style={styles.divider} />

        <View style={styles.cardHeaderRow}>
          <Ionicons name="location-outline" size={18} color={Colors.primaryOrange} />
          <Text style={styles.cardHeaderTitle}>Delivery / Pickup Address</Text>
        </View>
        <Text style={styles.infoTextAddress}>{order.deliveryAddress || 'No address provided'}</Text>

        <AppButton
          title="Contact Customer"
          onPress={handleContactCustomer}
          variant="outline"
          size="small"
          style={styles.contactBtn}
        />
      </View>

      {/* Order Items Breakdown */}
      <View style={styles.itemsCard}>
        <Text style={styles.cardHeaderTitle}>Order Items ({order.items.length})</Text>

        {order.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>{item.quantity}x</Text>
            </View>
            <View style={styles.itemMeta}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.customization && <Text style={styles.itemExtra}>Notes: {item.customization}</Text>}
            </View>
            <Text style={styles.itemPrice}>LKR {(item.unitPrice * item.quantity).toLocaleString()}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Financial Summary */}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>LKR {order.subtotal.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>LKR {order.deliveryFee.toLocaleString()}</Text>
        </View>
        {order.discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>- LKR {order.discount.toLocaleString()}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Paid</Text>
          <Text style={styles.totalValue}>LKR {order.total.toLocaleString()}</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 60,
  },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  statusBadge: {
    backgroundColor: Colors.lightOrange,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryOrange,
    textTransform: 'capitalize',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  statusBtn: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBtnActive: {
    backgroundColor: Colors.primaryOrange,
    borderColor: Colors.primaryOrange,
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  statusBtnTextActive: {
    color: Colors.card,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  infoTextName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  infoTextSub: {
    fontSize: 13,
    color: Colors.secondaryText,
  },
  infoTextAddress: {
    fontSize: 14,
    color: Colors.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  contactBtn: {
    marginTop: Spacing.sm,
  },
  itemsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs + 2,
  },
  qtyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.lightOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryOrange,
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  itemExtra: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
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
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  totalRow: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primaryOrange,
  },
});
