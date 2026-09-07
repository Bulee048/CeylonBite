import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { OrderStatus } from '../../types';
import { DetailedOrder } from '../../data/mockOrders';
import { orderService } from '../../services/orderService';

export default function AdminOrdersScreen() {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [orders, setOrders] = useState<DetailedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const fetched = await orderService.getAllOrders();
    setOrders(fetched);
    setLoading(false);
  };

  const filters = ['All', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === 'All') return true;
    return order.status === selectedFilter;
  });

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return { bg: '#DCFCE7', color: Colors.success };
      case 'preparing':
      case 'ready':
      case 'confirmed':
        return { bg: Colors.lightOrange, color: Colors.primaryOrange };
      case 'cancelled':
        return { bg: '#FEE2E2', color: Colors.error };
      default:
        return { bg: '#FEF3C7', color: '#D97706' };
    }
  };

  return (
    <ScreenContainer scrollable={false} hasPadding={false}>
      <View style={styles.headerPadding}>
        <Header title="Orders Management" subtitle="Manage & update live kitchen orders" showBack />

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {filteredOrders.length === 0 ? (
        <EmptyState
          iconName="receipt-outline"
          title="No Orders Found"
          description={`No orders currently match the filter "${selectedFilter}".`}
        />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const badgeStyle = getStatusBadgeStyle(item.status);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: '/admin-order/[id]' as any, params: { id: item.id } })}
                activeOpacity={0.8}
              >
                <View style={styles.headerRow}>
                  <View style={styles.idGroup}>
                    <Text style={styles.orderId}>{item.id}</Text>
                    <Text style={styles.orderType}>• {item.orderType ? item.orderType.toUpperCase() : 'DELIVERY'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
                    <Text style={[styles.statusText, { color: badgeStyle.color }]}>
                      {item.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="person-outline" size={14} color={Colors.secondaryText} />
                  <Text style={styles.customerName}>{item.customerName}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color={Colors.secondaryText} />
                  <Text style={styles.timeText}>{item.createdAt || 'Today, 2:30 PM'}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.footerRow}>
                  <View>
                    <Text style={styles.itemCountText}>{item.items.length} items</Text>
                    <Text style={styles.paymentText}>
                      {item.paymentMethod ? item.paymentMethod.toUpperCase() : 'CASH'}
                    </Text>
                  </View>
                  <View style={styles.rightGroup}>
                    <Text style={styles.amount}>LKR {(item.totalAmount || item.total || 0).toLocaleString()}</Text>
                    <View style={styles.viewBtn}>
                      <Text style={styles.viewBtnText}>Details</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.white} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
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
  filterScroll: {
    marginBottom: Spacing.sm,
  },
  filterContent: {
    gap: Spacing.xs,
    paddingRight: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryOrange,
    borderColor: Colors.primaryOrange,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  filterChipTextActive: {
    color: Colors.card,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: 110,
  },
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  orderType: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryText,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  timeText: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  paymentText: {
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  rightGroup: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  amount: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primaryOrange,
  },
  viewBtn: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
});
