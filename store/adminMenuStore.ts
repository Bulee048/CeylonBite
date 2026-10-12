import { create } from 'zustand';
import { FoodItem } from '../types';
import { menuService } from '../services/menuService';

interface AdminMenuStore {
  foods: FoodItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (item: Omit<FoodItem, 'id'>) => Promise<{ data: FoodItem | null; error: string | null }>;
  updateItem: (id: string, updatedFields: Partial<FoodItem>) => Promise<{ error: string | null }>;
  deleteItem: (id: string) => Promise<{ error: string | null }>;
  toggleAvailability: (id: string, currentStatus: boolean) => Promise<{ error: string | null }>;
  getFoodById: (id: string) => FoodItem | undefined;
}

export const useAdminMenuStore = create<AdminMenuStore>((set, get) => ({
  foods: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await menuService.getFoods();
      set({ foods: items, loading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to fetch menu items', loading: false });
    }
  },

  createItem: async (newItemData) => {
    set({ loading: true });
    const res = await menuService.createFood(newItemData);
    if (!res.error) {
      await get().fetchItems();
    } else {
      set({ loading: false });
    }
    return res;
  },

  updateItem: async (id, updatedFields) => {
    set({ loading: true });
    const res = await menuService.updateFood(id, updatedFields);
    if (!res.error) {
      await get().fetchItems();
    } else {
      set({ loading: false });
    }
    return res;
  },

  deleteItem: async (id) => {
    set({ loading: true });
    const res = await menuService.deleteFood(id);
    if (!res.error) {
      await get().fetchItems();
    } else {
      set({ loading: false });
    }
    return res;
  },

  toggleAvailability: async (id, currentStatus) => {
    const res = await menuService.toggleFoodAvailability(id, currentStatus);
    if (!res.error) {
      await get().fetchItems();
    }
    return res;
  },

  getFoodById: (id) => {
    return get().foods.find((f) => f.id === id);
  },
}));
