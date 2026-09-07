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

export default function AdminSettingsScreen() {
  const settingSections = [
    {
      title: 'Restaurant Profile',
      subtitle: 'CeylonBite Colombo 03 • Flagship Branch',
      icon: 'storefront-outline',
    },
    {
      title: 'Opening Hours',
      subtitle: 'Daily: 10:00 AM - 11:00 PM',
      icon: 'time-outline',
    },
    {
      title: 'Delivery Settings',
      subtitle: 'Radius: 10km • Delivery fee LKR 250',
      icon: 'bicycle-outline',
    },
    {
      title: 'Notification Preferences',
      subtitle: 'Order alerts, SMS & email reports',
      icon: 'notifications-outline',
    },
    {
      title: 'Admin Account & Security',
      subtitle: 'dulmin.admin@ceylonbite.lk',
      icon: 'key-outline',
    },
  ];

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <Header title="Admin Settings" subtitle="Restaurant branch & system configuration" showBack />

      {/* Customer App Preview Banner */}
      <View style={styles.previewCard}>
        <View style={styles.previewLeft}>
          <Ionicons name="phone-portrait-outline" size={24} color={Colors.primaryOrange} />
          <View style={styles.previewTextGroup}>
            <Text style={styles.previewTitle}>Customer Ordering App</Text>
            <Text style={styles.previewSub}>Switch view to test ordering flow</Text>
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
        {settingSections.map((sec, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.row, idx === settingSections.length - 1 && styles.noBorder]}
            onPress={() => Alert.alert('Admin Settings', `${sec.title} configuration modal.`)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={sec.icon as any} size={20} color={Colors.primaryDark} />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>{sec.title}</Text>
              <Text style={styles.rowSub}>{sec.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.secondaryText} />
          </TouchableOpacity>
        ))}
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
});
