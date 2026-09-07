import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import AppButton from '../../components/ui/AppButton';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { profile, user, signOut, updateProfile } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || 'Colombo 03, Sri Lanka');
  const [saving, setSaving] = useState(false);

  const openEditModal = () => {
    setFullName(profile?.fullName || '');
    setPhone(profile?.phone || '');
    setAddress(profile?.address || 'Colombo 03, Sri Lanka');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full Name cannot be empty.');
      return;
    }
    setSaving(true);
    const res = await updateProfile(fullName.trim(), phone.trim(), address.trim());
    setSaving(false);
    if (res.error) {
      Alert.alert('Update Failed', res.error);
    } else {
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    }
  };

  const profileMenuItems = [
    { icon: 'person-outline', title: 'Personal Information', subtitle: profile?.fullName || 'Dulmin Silva', action: openEditModal },
    { icon: 'location-outline', title: 'Delivery Addresses', subtitle: profile?.address || 'Colombo 03, Sri Lanka', action: openEditModal },
    { icon: 'heart-outline', title: 'My Favorites', route: '/(customer)/favorites' },
    { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Promotions, order alerts' },
    { icon: 'card-outline', title: 'Payment Methods', subtitle: 'Cash on delivery, Card' },
    { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Call 1990 or live chat' },
    { icon: 'information-circle-outline', title: 'About CeylonBite', subtitle: 'v1.0.0 Sri Lanka' },
  ];

  const handleLogout = async () => {
    const doLogout = async () => {
      await signOut();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        await doLogout();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  return (
    <ScreenContainer scrollable>
      <Header title="My Profile" subtitle="Account details & preferences" />

      {/* User Avatar Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {(profile?.fullName || 'Dulmin').charAt(0)}
          </Text>
          <TouchableOpacity style={styles.editAvatarBadge} onPress={openEditModal} activeOpacity={0.8}>
            <Ionicons name="pencil" size={14} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.nameText}>{profile?.fullName || 'Dulmin Silva'}</Text>
        <Text style={styles.emailText}>{profile?.email || user?.email || 'dulmin@example.com'}</Text>
        {profile?.phone ? <Text style={styles.phoneText}>📞 {profile.phone}</Text> : null}

        <TouchableOpacity style={styles.editBtn} onPress={openEditModal} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={16} color={Colors.primary} />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Switch to Admin Mode Banner */}
      <View style={styles.adminBanner}>
        <View style={styles.adminLeft}>
          <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
          <View style={styles.adminTextGroup}>
            <Text style={styles.adminTitle}>Restaurant Management</Text>
            <Text style={styles.adminSub}>Preview Admin Dashboard</Text>
          </View>
        </View>
        <AppButton
          title="Admin App"
          onPress={() => router.replace('/(admin)/dashboard')}
          size="small"
          variant="secondary"
          fullWidth={false}
        />
      </View>

      {/* Options List */}
      <View style={styles.menuCard}>
        {profileMenuItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.menuRow,
              idx === profileMenuItems.length - 1 && styles.noBorder,
            ]}
            onPress={() => {
              if (item.action) {
                item.action();
              } else if (item.route) {
                router.push(item.route as any);
              } else {
                Alert.alert('CeylonBite', `${item.title} settings page.`);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon as any} size={18} color={Colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.subtitle && <Text style={styles.menuSub}>{item.subtitle}</Text>}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.secondaryText} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Log Out Button */}
      <AppButton
        title="Log Out"
        onPress={handleLogout}
        variant="outline"
        style={styles.logoutBtn}
      />

      {/* Edit Profile Modal */}
      <Modal visible={isEditing} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customize Profile</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={24} color={Colors.primaryDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter full name"
              placeholderTextColor={Colors.secondaryText}
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              placeholderTextColor={Colors.secondaryText}
            />

            <Text style={styles.inputLabel}>Delivery Address</Text>
            <TextInput
              style={styles.textInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter delivery address"
              placeholderTextColor={Colors.secondaryText}
            />

            <View style={styles.modalActions}>
              <AppButton
                title="Cancel"
                onPress={() => setIsEditing(false)}
                variant="outline"
                style={{ flex: 1, marginRight: Spacing.sm }}
              />
              <AppButton
                title={saving ? "Saving..." : "Save Changes"}
                onPress={handleSaveProfile}
                disabled={saving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  userCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarLetter: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.white,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  emailText: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginTop: 2,
  },

  phoneText: {
    fontSize: 13,
    color: Colors.primaryDark,
    marginTop: 4,
    fontWeight: '600',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primaryDark,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm + 2,
    backgroundColor: Colors.lightOrange,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 4,
  },

  // Admin Switcher
  adminBanner: {
    backgroundColor: Colors.lightOrange,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  adminLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  adminTextGroup: {
    marginLeft: Spacing.sm,
  },
  adminTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  adminSub: {
    fontSize: 12,
    color: Colors.secondaryText,
  },

  // Menu List Card
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md - 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  menuSub: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  logoutBtn: {
    marginBottom: 40,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: 15,
    color: Colors.primaryDark,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
});
