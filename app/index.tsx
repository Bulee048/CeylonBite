import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import LoadingState from '../components/ui/LoadingState';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const { token, profile, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!token) {
        router.replace('/(auth)/login');
      } else if (profile?.role === 'admin') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(customer)/home');
      }
    }
  }, [isLoading, token, profile]);

  return (
    <View style={styles.container}>
      <LoadingState message="Connecting to CeylonBite..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
