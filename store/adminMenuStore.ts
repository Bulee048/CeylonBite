import { create } from 'zustand';
import { FoodItem } from '../types';
import { mockFoodItems } from '../data/mockData';

interface AdminMenuStore {
  foods: FoodItem[];
  addFood: (item: Omit<FoodItem, 'id'>) => void;
  updateFood: (id: string, updatedFields: Partial<FoodItem>) => void;
  deleteFood: (id: string) => void;
  toggleAvailability: (id: string) => void;
  getFoodById: (id: string) => FoodItem | undefined;
}

export const useAdminMenuStore = create<AdminMenuStore>((set, get) => ({
  foods: mockFoodItems,

  addFood: (newItemData) => {
    const newId = `f_${Date.now()}`;
    const newFoodItem: FoodItem = {
      ...newItemData,
      id: newId,
    };
    set((state) => ({
      foods: [newFoodItem, ...state.foods],
    }));
  },

  updateFood: (id, updatedFields) => {
    set((state) => ({
      foods: state.foods.map((food) =>
        food.id === id ? { ...food, ...updatedFields } : food
      ),
    }));
  },

  deleteFood: (id) => {
    set((state) => ({
      foods: state.foods.filter((food) => food.id !== id),
    }));
  },

  toggleAvailability: (id) => {
    set((state) => ({
      foods: state.foods.map((food) =>
        food.id === id ? { ...food, isAvailable: !food.isAvailable } : food
      ),
    }));
  },

  getFoodById: (id) => {
    return get().foods.find((f) => f.id === id);
  },
}));
