import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import AppInput from '../../components/ui/AppInput';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { Customer } from '../../types';
import { authService } from '../../services/authService';

export default function AdminCustomersScreen() {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await authService.getAllCustomers();
      setCustomers(fetched);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load customers';
      setError(msg);
      console.error('[AdminCustomers] Error:', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [loadCustomers])
  );

  const filteredCustomers = customers.filter((c) =>
    (c.name || '').toLowerCase().includes(query.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ScreenContainer scrollable={false} hasPadding={false}>
      <View style={styles.headerPadding}>
        <Header title="Customers List" subtitle="Registered CeylonBite app users" showBack />

        <AppInput
          placeholder="Search customers by name or email..."
          value={query}
          onChangeText={setQuery}
          leftIcon="search-outline"
        />
      </View>

      {loading ? (
        <LoadingState message="Loading customers from database..." />
      ) : error ? (
        <EmptyState
          iconName="alert-circle-outline"
          title="Could Not Load Customers"
          description={`Error: ${error}\n\nMake sure you are logged in as admin.`}
          buttonTitle="Retry"
          onButtonPress={loadCustomers}
        />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          iconName="people-outline"
          title="No Customers Found"
          description={`No customer matching "${query}" was found.`}
        />
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.infoCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.nameText}>{item.name}</Text>
                  <View style={[styles.statusTag, item.status === 'Active' ? styles.bgActive : styles.bgInactive]}>
                    <Text style={[styles.statusTagText, item.status === 'Active' ? styles.txActive : styles.txInactive]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.emailText}>{item.email}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.ordersCount} orders</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.spentText}>Spent LKR {item.totalSpent.toLocaleString()}</Text>
                </View>
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
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarLetter: {
    color: Colors.white,
    fontWeight: '900',
    fontSize: 20,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  bgActive: {
    backgroundColor: '#DCFCE7',
  },
  bgInactive: {
    backgroundColor: Colors.background,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  txActive: {
    color: Colors.success,
  },
  txInactive: {
    color: Colors.secondaryText,
  },
  emailText: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryOrange,
  },
  dot: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginHorizontal: 6,
  },
  spentText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});
