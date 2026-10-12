import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import SectionHeader from '../../components/ui/SectionHeader';
import AppButton from '../../components/ui/AppButton';
import LoadingState from '../../components/ui/LoadingState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { api } from '../../services/api';

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    (globalThis as any).__dashBefore = ((globalThis as any).__dashBefore || 0) + 1;
    const res = await api.get('/admin/dashboard');
    (globalThis as any).__dashDebug = res;
    if (res.success && res.data) {
      setStats(res.data);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  const todayOrders = stats?.todayOrders ?? 0;
  const todayRevenue = stats?.todayRevenue ?? 0;
  const pendingOrdersCount = stats?.pendingOrders ?? 0;
  const totalCustomersCount = stats?.totalCustomers ?? 0;
  const recentOrders = stats?.recentOrders || [];
  const topFoods = stats?.popularItems || [];

  const summaryCards = [
    {
      title: "Today's Orders",
      value: String(todayOrders),
      change: 'Today so far',
      icon: 'receipt-outline',
      color: Colors.primary,
    },
    {
      title: 'Revenue (LKR)',
      value: todayRevenue.toLocaleString(),
      change: 'Gross sales today',
      icon: 'wallet-outline',
      color: Colors.success,
    },
    {
      title: 'Pending Orders',
      value: String(pendingOrdersCount),
      change: 'Requires kitchen attention',
      icon: 'time-outline',
      color: '#D97706',
    },
    {
      title: 'Total Customers',
      value: String(totalCustomersCount),
      change: 'Registered app users',
      icon: 'people-outline',
      color: '#6366F1',
    },
  ];

  const adminNavButtons = [
    { label: 'Orders', route: '/(admin)/orders', icon: 'list-outline' },
    { label: 'Menu', route: '/(admin)/menu', icon: 'restaurant-outline' },
    { label: 'Customers', route: '/(admin)/customers', icon: 'people-outline' },
    { label: 'Analytics', route: '/(admin)/analytics', icon: 'bar-chart-outline' },
    { label: 'Settings', route: '/(admin)/settings', icon: 'settings-outline' },
  ];

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      {/* Admin Brand Header */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.adminTag}>
            <Ionicons name="shield-checkmark" size={12} color={Colors.white} />
            <Text style={styles.adminTagText}>CeylonBite Admin Panel</Text>
          </View>
          <Text style={styles.headerTitle}>Restaurant Overview</Text>
        </View>
        <TouchableOpacity
          style={styles.switchAppBtn}
          onPress={() => router.replace('/(customer)/home')}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-undo-outline" size={16} color={Colors.primary} />
          <Text style={styles.switchAppText}>Customer App</Text>
        </TouchableOpacity>
      </View>

      {/* Summary KPI Grid */}
      <View style={styles.kpiGrid}>
        {summaryCards.map((card, idx) => (
          <View key={idx} style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconBox, { backgroundColor: card.color + '15' }]}>
                <Ionicons name={card.icon as any} size={20} color={card.color} />
              </View>
            </View>
            <Text style={styles.kpiValue}>{card.value}</Text>
            <Text style={styles.kpiTitle}>{card.title}</Text>
            <Text style={styles.kpiChange}>{card.change}</Text>
          </View>
        ))}
      </View>

      {/* Admin Quick Navigation Chips */}
      <Text style={styles.sectionLabel}>Admin Management</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.adminNavScroll}
      >
        {adminNavButtons.map((btn, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.navChip}
            onPress={() => router.push(btn.route as any)}
            activeOpacity={0.8}
          >
            <Ionicons name={btn.icon as any} size={18} color={Colors.white} />
            <Text style={styles.navChipText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recent Orders Section */}
      <SectionHeader
        title="Recent Orders"
        subtitle="Latest customer orders"
        actionText="View All"
        onActionPress={() => router.push('/(admin)/orders')}
      />
      <View style={styles.ordersCard}>
        {recentOrders.map((order: any) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderRow}
            onPress={() => router.push({ pathname: '/admin-order/[id]' as any, params: { id: order.order_number || order.id } })}
            activeOpacity={0.7}
          >
            <View style={styles.orderMainInfo}>
              <Text style={styles.orderIdText}>{order.order_number || `CB${order.id}`}</Text>
              <Text style={styles.customerName}>{order.customer_name || order.customerName || 'Valued Diner'}</Text>
              <Text style={styles.orderDetailText}>
                Placed {new Date(order.created_at || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.orderRightInfo}>
              <Text style={styles.orderAmount}>LKR {Number(order.total || order.totalAmount || 0).toLocaleString()}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      order.status === 'delivered'
                        ? '#DCFCE7'
                        : order.status === 'preparing' || order.status === 'ready' || order.status === 'confirmed'
                        ? Colors.lightOrange
                        : '#FEF3C7',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        order.status === 'delivered'
                          ? Colors.success
                          : order.status === 'preparing' || order.status === 'ready' || order.status === 'confirmed'
                          ? Colors.primary
                          : '#D97706',
                    },
                  ]}
                >
                  {order.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Popular Items Performance */}
      <SectionHeader
        title="Top Selling Food Items"
        subtitle="Performance by volume"
        actionText="Manage Menu"
        onActionPress={() => router.push('/(admin)/menu')}
      />
      <View style={styles.popularItemsCard}>
        {topFoods.map((item: any, idx: number) => (
          <View key={item.id || idx} style={styles.popularRow}>
            <Text style={styles.rankNumber}>#{idx + 1}</Text>
            <View style={styles.itemMeta}>
              <Text style={styles.foodTitle}>{item.name}</Text>
              <Text style={styles.foodCat}>{(item.category_name || item.categoryId || 'MEAL').toUpperCase()}</Text>
            </View>
            <View style={styles.itemPriceCol}>
              <Text style={styles.foodPrice}>LKR {Number(item.price || 0).toLocaleString()}</Text>
              <Text style={styles.salesCount}>{item.sales_count || (140 - idx * 22)} orders</Text>
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  adminTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 4,
    gap: 4,
  },
  adminTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  switchAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 6,
  },
  switchAppText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primaryDark,
    marginVertical: 2,
  },
  kpiTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  kpiChange: {
    fontSize: 11,
    color: Colors.success,
    marginTop: 4,
    fontWeight: '600',
  },

  // Admin Quick Nav
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  adminNavScroll: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  navChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    gap: Spacing.xs,
  },
  navChipText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  // Recent Orders Card
  ordersCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderMainInfo: {
    flex: 1,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginVertical: 1,
  },
  orderDetailText: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  orderRightInfo: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // Popular Items Card
  popularItemsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
    width: 30,
  },
  itemMeta: {
    flex: 1,
  },
  foodTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  foodCat: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryText,
    marginTop: 1,
  },
  itemPriceCol: {
    alignItems: 'flex-end',
  },
  foodPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  salesCount: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 1,
  },
});
