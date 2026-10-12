import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import LoadingState from '../../components/ui/LoadingState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { api } from '../../services/api';

export default function AdminAnalyticsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get('/admin/analytics');
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.message || 'Failed to load analytics metrics');
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [fetchAnalytics])
  );

  const weeklySalesData = data?.weeklySales || [
    { day: 'Mon', heightPct: 0, amount: '0' },
    { day: 'Tue', heightPct: 0, amount: '0' },
    { day: 'Wed', heightPct: 0, amount: '0' },
    { day: 'Thu', heightPct: 0, amount: '0' },
    { day: 'Fri', heightPct: 0, amount: '0' },
    { day: 'Sat', heightPct: 0, amount: '0' },
    { day: 'Sun', heightPct: 0, amount: '0' },
  ];

  const topCategories = data?.topCategories || [];
  const topProducts = data?.topProducts || [];

  const totalWeeklySales = data?.totalWeeklyAmount
    ? `Total: LKR ${Number(data.totalWeeklyAmount).toLocaleString()}`
    : 'Total: LKR 0';

  const avgOrderValue = data?.averageOrderValue ? `LKR ${Number(data.averageOrderValue).toLocaleString()}` : 'LKR 0';
  const repeatRate = data?.repeatCustomerRate || '0%';
  const completionRate = data?.orderCompletionRate || '100%';

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Analytics & Insights" subtitle="Loading restaurant metrics..." showBack />
        <LoadingState message="Calculating restaurant analytics..." />
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Analytics & Insights" subtitle="Sales performance & key restaurant metrics" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
          <Text style={{ fontSize: 16, color: Colors.error, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.md }}>
            {error}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <Header title="Analytics & Insights" subtitle="Sales performance & key restaurant metrics" showBack />

      {/* Key KPI Stats Grid */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Avg Order Value</Text>
          <Text style={styles.statValue}>{avgOrderValue}</Text>
          <Text style={styles.statSub}>Real-time metric</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Repeat Customers</Text>
          <Text style={styles.statValue}>{repeatRate}</Text>
          <Text style={styles.statSub}>Loyal diners</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Order Completion</Text>
          <Text style={styles.statValue}>{completionRate}</Text>
          <Text style={styles.statSub}>High efficiency</Text>
        </View>
      </View>

      {/* Weekly Sales Custom Bar Visual */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Weekly Sales (Mon - Sun)</Text>
          <Text style={styles.cardBadgeText}>{totalWeeklySales}</Text>
        </View>

        <View style={styles.chartContainer}>
          {weeklySalesData.map((item: any, idx: number) => (
            <View key={idx} style={styles.barCol}>
              <Text style={styles.barLabelText}>{item.amount}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${Math.max(item.heightPct || 0, 4)}%` as any }]} />
              </View>
              <Text style={styles.dayText}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Top Categories Progress Visual */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Food Categories</Text>
        <Text style={styles.cardSub}>Share of total revenue</Text>

        {topCategories.length === 0 ? (
          <Text style={{ fontSize: 13, color: Colors.secondaryText, fontStyle: 'italic' }}>No category sales recorded yet.</Text>
        ) : (
          <View style={styles.progressList}>
            {topCategories.map((cat: any, idx: number) => (
              <View key={idx} style={styles.progressItem}>
                <View style={styles.catMetaRow}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catSales}>{cat.sales}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${cat.pct}%` as any }]} />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Top Products Table */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Performing Products</Text>
        <Text style={styles.cardSub}>Best sellers by volume & revenue</Text>

        {topProducts.length === 0 ? (
          <Text style={{ fontSize: 13, color: Colors.secondaryText, fontStyle: 'italic' }}>No item sales recorded yet.</Text>
        ) : (
          topProducts.map((prod: any, idx: number) => (
            <View key={idx} style={styles.prodRow}>
              <View style={styles.prodMeta}>
                <Text style={styles.prodName}>{prod.name}</Text>
                <Text style={styles.prodOrders}>{prod.orders} orders fulfilled</Text>
              </View>
              <Text style={styles.prodRev}>{prod.revenue}</Text>
            </View>
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 60,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primaryOrange,
    marginVertical: 2,
  },
  statSub: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '700',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginBottom: Spacing.md,
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryOrange,
  },

  // Bar Chart
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryText,
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 100,
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: Colors.primaryOrange,
    borderRadius: Radius.pill,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 6,
  },

  // Progress Bars
  progressList: {
    gap: Spacing.sm,
  },
  progressItem: {
    marginBottom: 4,
  },
  catMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  catSales: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryOrange,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryOrange,
    borderRadius: Radius.pill,
  },

  // Products Table
  prodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  prodMeta: {
    flex: 1,
  },
  prodName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  prodOrders: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  prodRev: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
});
