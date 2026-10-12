import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/common/Header';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import EmptyState from '../../components/ui/EmptyState';
import Colors from '../../constants/colors';
import Spacing from '../../constants/spacing';
import Radius from '../../constants/radius';
import { useAdminMenuStore } from '../../store/adminMenuStore';

export default function AdminEditFoodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const getFoodById = useAdminMenuStore((state) => state.getFoodById);
  const updateItem = useAdminMenuStore((state) => state.updateItem);
  const deleteItem = useAdminMenuStore((state) => state.deleteItem);
  const fetchItems = useAdminMenuStore((state) => state.fetchItems);
  const storeLoading = useAdminMenuStore((state) => state.loading);

  const [existingFood, setExistingFood] = useState(getFoodById(id || ''));

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [image, setImage] = useState('');
  const [rating, setRating] = useState('4.8');
  const [isPopular, setIsPopular] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    const init = async () => {
      let food = getFoodById(id || '');
      if (!food) {
        await fetchItems();
        food = useAdminMenuStore.getState().getFoodById(id || '');
      }
      setExistingFood(food);
      if (food) {
        setName(food.name);
        setDescription(food.description);
        setPrice(food.price.toString());
        setCategoryId(food.categoryId);
        setImage(food.image);
        setRating((food.rating || 4.5).toString());
        setIsPopular(food.isPopular || false);
        setIsAvailable(food.isAvailable !== false);
      }
    };
    init();
  }, [id]);

  if (!existingFood) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Edit Food Item" showBack />
        <EmptyState
          iconName="restaurant-outline"
          title="Food Item Not Found"
          description={`No item exists with ID "${id}".`}
          buttonTitle="Back to Menu"
          onButtonPress={() => router.back()}
        />
      </ScreenContainer>
    );
  }

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Food name is required.');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('Validation Error', 'Price must be a valid number greater than 0.');
      return;
    }

    if (!categoryId.trim()) {
      Alert.alert('Validation Error', 'Category is required.');
      return;
    }

    if (image.trim() && !image.trim().startsWith('http://') && !image.trim().startsWith('https://')) {
      Alert.alert('Validation Error', 'Image URL must start with http:// or https://');
      return;
    }

    const { error } = await updateItem(existingFood.id, {
      name: name.trim(),
      description: description.trim(),
      price: numericPrice,
      categoryId: categoryId.toLowerCase().trim(),
      image: image.trim(),
      rating: parseFloat(rating) || 4.5,
      isPopular,
      isAvailable,
    });

    if (error) {
      Alert.alert('Update Failed', error);
      return;
    }

    Alert.alert('Changes Saved', `${name} has been updated successfully!`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleDeleteItem = () => {
    Alert.alert('Delete Food Item', `Are you sure you want to delete "${existingFood.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteItem(existingFood.id);
          if (error) {
            Alert.alert('Delete Failed', error);
          } else {
            router.back();
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>
      <Header title="Edit Food Item" subtitle={`ID: ${existingFood.id}`} showBack />

      <View style={styles.formCard}>
        <AppInput label="Food Name *" value={name} onChangeText={setName} />

        <AppInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <AppInput label="Price (LKR) *" value={price} onChangeText={setPrice} keyboardType="numeric" />

        <AppInput label="Category ID *" value={categoryId} onChangeText={setCategoryId} />

        <AppInput label="Image URL" value={image} onChangeText={setImage} />

        <AppInput label="Rating" value={rating} onChangeText={setRating} keyboardType="numeric" />

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

        <AppButton
          title={storeLoading ? "Saving..." : "Save Changes"}
          onPress={handleSaveChanges}
          disabled={storeLoading}
          style={styles.submitBtn}
        />
        <AppButton
          title="Delete Item"
          onPress={handleDeleteItem}
          disabled={storeLoading}
          variant="outline"
          style={styles.deleteBtn}
        />
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
  deleteBtn: {
    marginTop: Spacing.sm,
    borderColor: Colors.error,
  },
});
