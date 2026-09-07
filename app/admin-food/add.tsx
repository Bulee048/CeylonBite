import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { useAdminMenuStore } from '../../store/adminMenuStore';

export default function AdminAddFoodScreen() {
  const addFood = useAdminMenuStore((state) => state.addFood);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('burgers');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800');
  const [rating, setRating] = useState('4.8');
  const [isPopular, setIsPopular] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const handleAddFood = () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Food name is required.');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('Validation Error', 'Price must be greater than 0.');
      return;
    }

    if (!categoryId.trim()) {
      Alert.alert('Validation Error', 'Category is required.');
      return;
    }

    addFood({
      name: name.trim(),
      description: description.trim() || 'Delicious CeylonBite meal made fresh.',
      price: numericPrice,
      categoryId: categoryId.toLowerCase().trim(),
      image: image.trim() || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
      rating: parseFloat(rating) || 4.5,
      isPopular,
      isAvailable,
    });

    Alert.alert('Success', `${name} added to CeylonBite Menu!`, [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <Header title="Add New Food" subtitle="Create a new menu item for CeylonBite" showBack />

      <View style={styles.formCard}>
        <AppInput
          label="Food Name *"
          placeholder="e.g. Ceylon Spicy Kottu Special"
          value={name}
          onChangeText={setName}
        />

        <AppInput
          label="Description"
          placeholder="e.g. Shredded roti sautéed with vegetables, egg & spices"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <AppInput
          label="Price (LKR) *"
          placeholder="e.g. 1850"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <AppInput
          label="Category ID *"
          placeholder="e.g. burgers, chicken, rice, pizza, drinks"
          value={categoryId}
          onChangeText={setCategoryId}
        />

        <AppInput
          label="Image URL"
          placeholder="https://images.unsplash.com/..."
          value={image}
          onChangeText={setImage}
        />

        <AppInput
          label="Rating (0.0 - 5.0)"
          placeholder="4.8"
          value={rating}
          onChangeText={setRating}
          keyboardType="numeric"
        />

        {/* Toggle Switches */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Popular Item</Text>
            <Text style={styles.switchSub}>Show item in Popular Meals section</Text>
          </View>
          <Switch
            value={isPopular}
            onValueChange={setIsPopular}
            trackColor={{ false: Colors.border, true: Colors.lightOrange }}
            thumbColor={isPopular ? Colors.primaryOrange : Colors.secondaryText}
          />
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Available for Ordering</Text>
            <Text style={styles.switchSub}>Allow customers to order this food</Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ false: Colors.border, true: Colors.lightOrange }}
            thumbColor={isAvailable ? Colors.primaryOrange : Colors.secondaryText}
          />
        </View>

        <AppButton title="Add Item to Menu" onPress={handleAddFood} style={styles.submitBtn} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 60,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  switchSub: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
});
