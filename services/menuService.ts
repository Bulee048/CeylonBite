import { api } from './api';
import { FoodItem, Category } from '../types';

// Server-side extras catalog entry. Prices originate from the database and are
// never taken from the client for billing.
export interface ExtraOption {
  id: string;
  name: string;
  price: number;
}

const toCategory = (cat: any): Category => ({
  id: String(cat.slug || cat.id || cat.CategoryID),
  name: cat.name || cat.Name,
  iconName: cat.icon_name || cat.IconName || 'fast-food-outline',
});

const toFood = (f: any): FoodItem => ({
  id: String(f.id || f.FoodID),
  name: f.name || f.Name,
  description: f.description || f.Description,
  price: Number(f.price || f.Price),
  image:
    f.image_url ||
    f.ImageURL ||
    f.image ||
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
  categoryId: f.category_slug || f.category_id || String(f.CategoryID ?? 'burgers'),
  rating: Number(f.rating || f.Rating || 4.5),
  isAvailable: f.is_available !== undefined ? Boolean(f.is_available) : Boolean(f.IsAvailable),
  isPopular: f.is_popular !== undefined ? Boolean(f.is_popular) : Boolean(f.IsPopular),
});

export const menuService = {
  async getCategories(): Promise<Category[]> {
    const res = await api.get('/categories');
    if (res.success && Array.isArray(res.data)) {
      return res.data.map(toCategory);
    }
    throw new Error(res.message || 'Failed to load categories from the server.');
  },

  async getFoods(): Promise<FoodItem[]> {
    const res = await api.get('/foods');
    if (res.success && Array.isArray(res.data)) {
      return res.data.map(toFood);
    }
    throw new Error(res.message || 'Failed to load the menu from the server.');
  },

  async getPopularFoods(): Promise<FoodItem[]> {
    const all = await menuService.getFoods();
    return all.filter((item) => item.isPopular);
  },

  async getFoodById(id: string): Promise<FoodItem> {
    const res = await api.get(`/foods/${id}`);
    if (res.success && res.data) {
      return toFood(res.data);
    }
    throw new Error(res.message || `Food item #${id} was not found on the server.`);
  },

  // Available extras/toppings for the order builder. Prices come from the
  // server catalog so the UI never invents a price.
  async getExtras(): Promise<ExtraOption[]> {
    const res = await api.get('/extras');
    if (res.success && Array.isArray(res.data)) {
      return res.data.map((e: any) => ({
        id: String(e.id ?? e.ExtraID),
        name: e.name || e.Name || 'Extra',
        price: Number(e.price ?? e.Price ?? 0),
      }));
    }
    throw new Error(res.message || 'Failed to load extras from the server.');
  },

  // Admin Food CRUD
  async createFood(food: Omit<FoodItem, 'id'>): Promise<{ data: FoodItem | null; error: string | null }> {
    const res = await api.post('/admin/foods', {
      name: food.name,
      description: food.description,
      price: food.price,
      image_url: food.image,
      category_id: food.categoryId,
      rating: food.rating || 4.5,
      is_available: food.isAvailable,
      is_popular: food.isPopular,
    });

    if (!res.success) {
      return { data: null, error: res.message || 'Failed to create food item' };
    }

    const created: FoodItem = {
      id: String(res.data.id || res.data.FoodID),
      name: res.data.name || food.name,
      description: res.data.description || food.description,
      price: Number(res.data.price || food.price),
      image: res.data.image_url || food.image,
      categoryId: food.categoryId,
      rating: food.rating || 4.5,
      isAvailable: food.isAvailable,
      isPopular: food.isPopular,
    };

    return { data: created, error: null };
  },

  async updateFood(id: string, updates: Partial<FoodItem>): Promise<{ error: string | null }> {
    const res = await api.put(`/admin/foods/${id}`, {
      name: updates.name,
      description: updates.description,
      price: updates.price,
      image_url: updates.image,
      category_id: updates.categoryId,
      rating: updates.rating,
      is_available: updates.isAvailable,
      is_popular: updates.isPopular,
    });
    if (!res.success) return { error: res.message || 'Failed to update food' };
    return { error: null };
  },

  async deleteFood(id: string): Promise<{ error: string | null }> {
    const res = await api.delete(`/admin/foods/${id}`);
    if (!res.success) return { error: res.message || 'Failed to delete food' };
    return { error: null };
  },

  async toggleFoodAvailability(id: string, currentStatus: boolean): Promise<{ error: string | null }> {
    const res = await api.patch(`/admin/foods/${id}/availability`, { is_available: !currentStatus });
    if (!res.success) return { error: res.message || 'Failed to toggle availability' };
    return { error: null };
  },
};