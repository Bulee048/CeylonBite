import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import ScreenContainer from '../../components/ui/ScreenContainer';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { useAuthStore } from '../../store/authStore';

const logoImg = require('../../assets/images/logo.png');

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signUp = useAuthStore((state) => state.signUp);

  const handleRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim(), phone.trim());
    setLoading(false);

    if (error) {
      Alert.alert('Registration Failed', error);
      return;
    }

    Alert.alert('Account Created', 'Welcome to CeylonBite!', [
      {
        text: 'OK',
        onPress: () => router.replace('/(customer)/home'),
      },
    ]);
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={Colors.primaryDark} />
      </TouchableOpacity>

      <View style={styles.brandSection}>
        <Image
          source={logoImg}
          style={styles.logoImage}
          contentFit="contain"
        />
        <Text style={styles.brandTagline}>GOOD FOOD • BRIGHTER DAYS</Text>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join CeylonBite today</Text>

          <AppInput
            label="Full Name *"
            placeholder="e.g. Dulmin Silva"
            value={fullName}
            onChangeText={setFullName}
            leftIcon="person-outline"
          />

          <AppInput
            label="Email Address *"
            placeholder="e.g. dulmin@ceylonbite.lk"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
          />

          <AppInput
            label="Phone Number"
            placeholder="e.g. +94 77 123 4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />

          <AppInput
            label="Password *"
            placeholder="Min 6 characters"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon="lock-closed-outline"
          />

          <AppInput
            label="Confirm Password *"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            leftIcon="shield-checkmark-outline"
          />

          <AppButton
            title={loading ? "Creating Account..." : "Create CeylonBite Account"}
            onPress={handleRegister}
            disabled={loading}
            size="large"
            style={styles.registerBtn}
          />

          <View style={styles.loginRow}>
            <Text style={styles.hasAccountText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}> Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#F7F4F1',
    alignItems: 'center',
    minHeight: '100%',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    width: '100%',
  },
  logoImage: {
    width: 180,
    height: 70,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  card: {
    width: '94%',
    maxWidth: 420,
    backgroundColor: Colors.card,
    borderRadius: 26,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primaryDark,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: Spacing.lg,
    marginTop: 4,
  },
  registerBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    height: 54,
    borderRadius: 27,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hasAccountText: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
});
