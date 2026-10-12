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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = useAuthStore((state) => state.signIn);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    const { error, role } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error);
      return;
    }

    if (role === 'admin') {
      router.replace('/(admin)/dashboard');
    } else {
      router.replace('/(customer)/home');
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      {/* Decorative Subtle Background Accents */}
      <View style={styles.topAccentCircle} />
      <View style={styles.bottomAccentCircle} />

      {/* Top Brand Area */}
      <View style={styles.brandSection}>
        <Image
          source={logoImg}
          style={styles.logoImage}
          contentFit="contain"
        />
        <Text style={styles.brandTagline}>GOOD FOOD • BRIGHTER DAYS</Text>
      </View>

      {/* Login Card */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subText}>Sign in to continue to CeylonBite</Text>

          <AppInput
            label="Email Address"
            placeholder="e.g. dulmin@ceylonbite.lk"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
          />

          <AppInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon="lock-closed-outline"
          />

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => Alert.alert('Reset Password', 'Password reset instructions sent.')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.loginBtnText}>
              {loading ? 'Logging in...' : 'Login to CeylonBite'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} style={styles.btnIcon} />
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.noAccountText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
              <Text style={styles.registerLink}> Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Subtle Brand Values Strip */}
      <View style={styles.brandValuesRow}>
        <View style={styles.valueItem}>
          <Ionicons name="leaf-outline" size={13} color={Colors.secondaryText} />
          <Text style={styles.valueText}>Fresh Ingredients</Text>
        </View>
        <Text style={styles.dotSeparator}>•</Text>
        <View style={styles.valueItem}>
          <Ionicons name="heart-outline" size={13} color={Colors.secondaryText} />
          <Text style={styles.valueText}>Authentic Taste</Text>
        </View>
        <Text style={styles.dotSeparator}>•</Text>
        <View style={styles.valueItem}>
          <Ionicons name="bicycle-outline" size={13} color={Colors.secondaryText} />
          <Text style={styles.valueText}>Fast Delivery</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#F7F4F1',
    alignItems: 'center',
    position: 'relative',
    minHeight: '100%',
  },
  // Background Accents
  topAccentCircle: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary + '0D', // 5% opacity
    pointerEvents: 'none',
  },
  bottomAccentCircle: {
    position: 'absolute',
    bottom: 20,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary + '08',
    pointerEvents: 'none',
  },

  // Brand Header Area
  brandSection: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  logoImage: {
    width: 220,
    height: 110,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 1.5,
    marginTop: Spacing.xs,
  },

  // Login Card
  cardContainer: {
    width: '100%',
    alignItems: 'center',
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
  welcomeText: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primaryDark,
    letterSpacing: -0.3,
  },
  subText: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: Spacing.lg,
    marginTop: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  loginBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  btnIcon: {
    marginLeft: Spacing.sm,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccountText: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },

  // Brand Values Strip
  brandValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    gap: 8,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  dotSeparator: {
    fontSize: 10,
    color: Colors.border,
  },
});

