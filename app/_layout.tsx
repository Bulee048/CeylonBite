import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import Colors from '../constants/colors';

export default function RootLayout() {
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
