import { api } from './api';

export const favoriteService = {
  async getUserFavorites(): Promise<string[]> {
    const res = await api.get('/favorites');
    if (res.success && Array.isArray(res.data)) {
      return res.data.map((f: any) => String(f.food_id || f.FoodID));
    }
    return [];
  },

  async addFavorite(foodId: string): Promise<{ error: string | null }> {
    const res = await api.post(`/favorites/${foodId}`);
    if (!res.success) return { error: res.message || 'Failed to add favorite' };
    return { error: null };
  },

  async removeFavorite(foodId: string): Promise<{ error: string | null }> {
    const res = await api.delete(`/favorites/${foodId}`);
    if (!res.success) return { error: res.message || 'Failed to remove favorite' };
    return { error: null };
  },
};
