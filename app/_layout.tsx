import { Stack, useSegments, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import Colors from '../constants/colors';
import { useAuthStore } from '../store/authStore';
import { setUnauthorizedHandler } from '../services/api';

export default function RootLayout() {
  const segments = useSegments();
  const { isAuthenticated, isLoading, user, initialize, signOut } = useAuthStore();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (Platform.OS === 'web') {
        alert('Session expired, please login again');
      } else {
        Alert.alert('Session Expired', 'Please login again to continue.');
      }
      signOut();
    });
    initialize();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const isIndex = (segments[0] as string) === 'index' || (segments as string[]).length === 0;

    if (!isAuthenticated && !inAuthGroup && !isIndex) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAdminGroup && user?.role !== 'admin') {
      router.replace('/(customer)/home');
    }
  }, [isAuthenticated, isLoading, segments, user]);

  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen
          name="food/[id]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="cart/index"
          options={{
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="checkout/index"
          options={{
            presentation: 'card',
          }}
        />
      </Stack>
    </>
  );
}
