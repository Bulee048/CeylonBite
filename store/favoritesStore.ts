import { create } from 'zustand';

interface FavoritesStore {
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favoriteIds: ['f1', 'f3', 'f7'], // Default initial favorites for demo

  toggleFavorite: (id: string) => {
    set((state) => {
      const exists = state.favoriteIds.includes(id);
      if (exists) {
        return { favoriteIds: state.favoriteIds.filter((favId) => favId !== id) };
      } else {
        return { favoriteIds: [...state.favoriteIds, id] };
      }
    });
  },

  isFavorite: (id: string) => {
    return get().favoriteIds.includes(id);
  },
}));
