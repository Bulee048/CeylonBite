import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import AppButton from '../../components/ui/AppButton';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { DetailedOrder, TrackStatus } from '../../data/mockOrders';
import { useAuthStore } from '../../store/authStore';
import { orderService } from '../../services/orderService';

export default function CustomerOrdersScreen() {
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [orders, setOrders] = useState<DetailedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    const userOrders = await orderService.getUserOrders(user?.id || '');
    setOrders(userOrders);
    setLoading(false);
  };

  const filteredOrders = orders.filter((o) => o.type === activeTab);

  const getStatusBadge = (status: TrackStatus) => {
    switch (status) {
      case 'preparing':
        return { label: 'Preparing 🍳', color: Colors.primary, bg: Colors.lightOrange };
      case 'confirmed':
        return { label: 'Confirmed 📝', color: '#D97706', bg: '#FEF3C7' };
      case 'ready':
        return { label: 'Ready 🛵', color: '#2563EB', bg: '#DBEAFE' };
      case 'delivered':
        return { label: 'Delivered ✅', color: Colors.success, bg: '#DCFCE7' };
      case 'cancelled':
        return { label: 'Cancelled ❌', color: Colors.error, bg: '#FEE2E2' };
    }
  };

  const renderCompactTracker = (status: TrackStatus) => {
    const steps: { label: string; key: TrackStatus }[] = [
      { label: 'Confirmed', key: 'confirmed' },
      { label: 'Preparing', key: 'preparing' },
      { label: 'Ready', key: 'ready' },
      { label: 'Delivered', key: 'delivered' },
    ];

    const getStepIndex = (st: TrackStatus) => {
      switch (st) {
        case 'confirmed': return 0;
        case 'preparing': return 1;
        case 'ready': return 2;
        case 'delivered': return 3;
        default: return 0;
      }
    };

    const currentIndex = getStepIndex(status);

    return (
      <View style={styles.trackerContainer}>
        <View style={styles.trackerLineBackground} />
        <View
          style={[
            styles.trackerLineActive,
            { width: `${(currentIndex / (steps.length - 1)) * 100}%` },
          ]}
        />
        {steps.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <View key={step.key} style={styles.trackerStepNode}>
              <View
                style={[
                  styles.stepDot,
                  isDone ? styles.stepDotActive : styles.stepDotInactive,
                  isCurrent && styles.stepDotCurrent,
                ]}
              >
                {isDone && <Ionicons name="checkmark" size={10} color={Colors.white} />}
              </View>
              <Text style={[styles.stepText, isDone && styles.stepTextActive]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const handleTrackOrder = (orderId: string) => {
    router.push({
      pathname: '/order/[id]' as any,
      params: { id: orderId },
    });
  };

  const handleReorder = () => {
    Alert.alert('Reorder Meal', 'Reorder functionality will be added in a future update.');
  };

  return (
    <ScreenContainer scrollable={false} hasPadding={false}>
      <View style={styles.headerPadding}>
        <Header
          title="My Orders"
          subtitle="Track and review your CeylonBite orders"
        />

        {/* Tab Segment Switcher */}
        <View style={styles.tabSegmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'active' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('active')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'active' && styles.segmentTextActive]}>
              Active Orders ({orders.filter((o) => o.type === 'active').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'past' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('past')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'past' && styles.segmentTextActive]}>
              Past Orders
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredOrders.length === 0 ? (
        <EmptyState
          iconName="receipt-outline"
          title={`No ${activeTab === 'active' ? 'Active' : 'Past'} Orders`}
          description="Looks like you haven't placed any orders in this section."
          buttonTitle="Browse Menu"
          onButtonPress={() => router.push('/(customer)/menu')}
        />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const statusInfo = getStatusBadge(item.status);
            const totalItemsCount = item.items.reduce((sum, i) => sum + i.quantity, 0);

            return (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>Order #{item.id}</Text>
                    <Text style={styles.orderDate}>{item.placedTime}</Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                {/* Items Summary Line */}
                <Text style={styles.summaryText} numberOfLines={2}>
                  {item.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </Text>

                {/* Active Order Progress Indicator */}
                {item.type === 'active' && renderCompactTracker(item.status)}

                <View style={styles.divider} />

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.itemCountText}>{totalItemsCount} Items</Text>
                    <Text style={styles.totalPriceText}>LKR {item.total.toLocaleString()}</Text>
                  </View>

                  {item.type === 'active' ? (
                    <AppButton
                      title="Track Order"
                      onPress={() => handleTrackOrder(item.id)}
                      size="small"
                      variant="primary"
                      fullWidth={false}
                      style={styles.actionBtn}
                    />
                  ) : (
                    <View style={styles.pastActionRow}>
                      <AppButton
                        title="View Details"
                        onPress={() => handleTrackOrder(item.id)}
                        size="small"
                        variant="outline"
                        fullWidth={false}
                        style={styles.pastBtn}
                      />
                      <AppButton
                        title="Reorder"
                        onPress={handleReorder}
                        size="small"
                        variant="secondary"
                        fullWidth={false}
                        style={styles.pastBtn}
                      />
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerPadding: {
    paddingHorizontal: Spacing.md,
  },
  tabSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: Radius.pill,
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  segmentTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: 110,
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 13,
    color: Colors.primaryDark,
    marginVertical: 4,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm + 2,
  },

  // Compact Tracker
  trackerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    position: 'relative',
    paddingHorizontal: 6,
  },
  trackerLineBackground: {
    position: 'absolute',
    top: 9,
    left: 18,
    right: 18,
    height: 3,
    backgroundColor: Colors.border,
  },
  trackerLineActive: {
    position: 'absolute',
    top: 9,
    left: 18,
    height: 3,
    backgroundColor: Colors.primary,
  },
  trackerStepNode: {
    alignItems: 'center',
    zIndex: 2,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotInactive: {
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepDotCurrent: {
    borderWidth: 2,
    borderColor: Colors.primaryDark,
  },
  stepText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.secondaryText,
    marginTop: 4,
  },
  stepTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCountText: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 1,
  },
  actionBtn: {
    minWidth: 110,
  },
  pastActionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  pastBtn: {
    minWidth: 90,
  },
});
