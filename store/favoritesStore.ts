import { create } from 'zustand';
import { favoriteService } from '../services/favoriteService';

interface FavoritesStore {
  favoriteIds: string[];
  setFavoriteIds: (ids: string[]) => void;
  toggleFavorite: (id: string) => Promise<{ error: string | null }>;
  isFavorite: (id: string) => boolean;
  loadFavorites: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favoriteIds: [],

  setFavoriteIds: (ids: string[]) => set({ favoriteIds: ids }),

  loadFavorites: async () => {
    const ids = await favoriteService.getUserFavorites();
    set({ favoriteIds: ids });
  },

  toggleFavorite: async (id: string): Promise<{ error: string | null }> => {
    const { favoriteIds } = get();
    const exists = favoriteIds.includes(id);

    // Optimistic update with rollback on API failure
    if (exists) {
      set((state) => ({ favoriteIds: state.favoriteIds.filter((favId) => favId !== id) }));
      const res = await favoriteService.removeFavorite(id);
      if (res.error) {
        // Rollback: restore the favorite id
        set({ favoriteIds: [...get().favoriteIds, id] });
        return { error: res.error };
      }
    } else {
      set((state) => ({ favoriteIds: [...state.favoriteIds, id] }));
      const res = await favoriteService.addFavorite(id);
      if (res.error) {
        // Rollback: remove the optimistic id
        set((state) => ({ favoriteIds: state.favoriteIds.filter((favId) => favId !== id) }));
        return { error: res.error };
      }
    }
    return { error: null };
  },

  isFavorite: (id: string) => {
    return get().favoriteIds.includes(id);
  },
}));
