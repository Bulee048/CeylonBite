import { api } from './api';
import { FoodItem, Category } from '../types';
import { mockFoodItems, mockCategories } from '../data/mockData';

export const menuService = {
  async getCategories(): Promise<Category[]> {
    try {
      const res = await api.get('/categories');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((cat: any) => ({
          id: String(cat.slug || cat.id || cat.CategoryID),
          name: cat.name || cat.Name,
          iconName: cat.icon_name || cat.IconName || 'fast-food-outline',
        }));
      }
      return mockCategories;
    } catch (err) {
      console.warn('⚠️ API Categories fetch failed, using fallback:', err);
      return mockCategories;
    }
  },

  async getFoods(): Promise<FoodItem[]> {
    try {
      const res = await api.get('/foods');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((f: any) => ({
          id: String(f.id || f.FoodID),
          name: f.name || f.Name,
          description: f.description || f.Description,
          price: Number(f.price || f.Price),
          image: f.image_url || f.ImageURL || f.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
          categoryId: f.category_slug || f.category_id || f.CategoryID || 'burgers',
          rating: Number(f.rating || f.Rating || 4.5),
          isAvailable: f.is_available !== undefined ? Boolean(f.is_available) : Boolean(f.IsAvailable),
          isPopular: f.is_popular !== undefined ? Boolean(f.is_popular) : Boolean(f.IsPopular),
        }));
      }
      return mockFoodItems;
    } catch (err) {
      console.warn('⚠️ API Foods fetch failed, using fallback:', err);
      return mockFoodItems;
    }
  },

  async getPopularFoods(): Promise<FoodItem[]> {
    const all = await menuService.getFoods();
    return all.filter((item) => item.isPopular);
  },

  async getFoodById(id: string): Promise<FoodItem | undefined> {
    const res = await api.get(`/foods/${id}`);
    if (res.success && res.data) {
      const f = res.data;
      return {
        id: String(f.id || f.FoodID),
        name: f.name || f.Name,
        description: f.description || f.Description,
        price: Number(f.price || f.Price),
        image: f.image_url || f.ImageURL || f.image,
        categoryId: f.category_slug || f.category_id || 'burgers',
        rating: Number(f.rating || f.Rating || 4.5),
        isAvailable: Boolean(f.is_available ?? f.IsAvailable),
        isPopular: Boolean(f.is_popular ?? f.IsPopular),
      };
    }
    const all = await menuService.getFoods();
    return all.find((item) => item.id === id);
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
    const res = await api.put(`/admin/foods/${id}`, updates);
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
