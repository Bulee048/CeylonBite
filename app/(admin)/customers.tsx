import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import AppInput from '../../components/ui/AppInput';
import EmptyState from '../../components/ui/EmptyState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { Customer } from '../../types';

export default function AdminCustomersScreen() {
  const [query, setQuery] = useState('');

  const mockCustomers: Customer[] = [
    {
      id: 'c1',
      name: 'Dulmin Silva',
      email: 'dulmin@example.com',
      phone: '+94 77 123 4567',
      ordersCount: 8,
      totalSpent: 24500,
      status: 'Active',
    },
    {
      id: 'c2',
      name: 'Kavindi Perera',
      email: 'kavindi@gmail.com',
      phone: '+94 71 987 6543',
      ordersCount: 14,
      totalSpent: 42800,
      status: 'Active',
    },
    {
      id: 'c3',
      name: 'Kasun Jayawardena',
      email: 'kasun@yahoo.com',
      phone: '+94 75 444 3322',
      ordersCount: 5,
      totalSpent: 12400,
      status: 'Active',
    },
    {
      id: 'c4',
      name: 'Nimesha Fernando',
      email: 'nimesha@hotmail.com',
      phone: '+94 72 555 6677',
      ordersCount: 2,
      totalSpent: 4500,
      status: 'Inactive',
    },
  ];

  const filteredCustomers = mockCustomers.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.email.toLowerCase().includes(query.toLowerCase())
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

      {filteredCustomers.length === 0 ? (
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
