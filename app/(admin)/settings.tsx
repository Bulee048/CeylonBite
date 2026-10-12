import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import AppButton from '../../components/ui/AppButton';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { useAuthStore } from '../../store/authStore';

export default function AdminSettingsScreen() {
  const { user, signOut } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out of the admin console?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <Header title="Admin Settings" subtitle="Restaurant branch & system configuration" showBack />

      {/* Customer App Preview Banner */}
      <View style={styles.previewCard}>
        <View style={styles.previewLeft}>
          <Ionicons name="phone-portrait-outline" size={24} color={Colors.primaryOrange} />
          <View style={styles.previewTextGroup}>
            <Text style={styles.previewTitle}>Customer Ordering App</Text>
            <Text style={styles.previewSub}>Switch view to test customer ordering flow</Text>
          </View>
        </View>
        <AppButton
          title="Preview Customer App"
          onPress={() => router.replace('/(customer)/home')}
          size="small"
          style={styles.previewBtn}
        />
      </View>

      {/* Settings Options List */}
      <View style={styles.settingsCard}>
        {/* Admin Account Section */}
        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-circle-outline" size={22} color={Colors.primaryDark} />
          </View>
          <View style={styles.rowTextCol}>
            <Text style={styles.rowTitle}>{user?.fullName || 'System Administrator'}</Text>
            <Text style={styles.rowSub}>{user?.email || 'admin@ceylonbite.lk'}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>ADMIN</Text>
          </View>
        </View>

        {/* Restaurant Info Read-Only */}
        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <Ionicons name="storefront-outline" size={20} color={Colors.primaryDark} />
          </View>
          <View style={styles.rowTextCol}>
            <Text style={styles.rowTitle}>CeylonBite Flagship Branch</Text>
            <Text style={styles.rowSub}>No. 45 Galle Road, Colombo 03 • (Active)</Text>
          </View>
        </View>

        {/* Logout Row */}
        <TouchableOpacity style={[styles.row, styles.noBorder]} onPress={handleLogout} activeOpacity={0.7}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          </View>
          <View style={styles.rowTextCol}>
            <Text style={[styles.rowTitle, { color: Colors.error }]}>Log Out</Text>
            <Text style={styles.rowSub}>Sign out of your admin session</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.secondaryText} />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 60,
  },
  previewCard: {
    backgroundColor: Colors.lightOrange,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryOrange,
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  previewTextGroup: {
    marginLeft: Spacing.sm,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  previewSub: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  previewBtn: {
    alignSelf: 'flex-start',
  },
  settingsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowTextCol: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: Colors.primaryOrange,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  roleBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
