import { create } from 'zustand';
import { api } from '../services/api';
import { authService, UserProfile } from '../services/authService';
import { useFavoritesStore } from './favoritesStore';
import { useCartStore } from './cartStore';
import { router } from 'expo-router';

interface AuthStore {
  token: string | null;
  user: UserProfile | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: string }>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (fullName: string, phone: string, address?: string) => Promise<{ error: string | null }>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const token = await api.getToken();

      if (token) {
        const profile = await authService.getProfile();
        if (profile) {
          set({
            token,
            user: profile,
            profile,
            isAuthenticated: true,
            isLoading: false,
          });
          // Best-effort: hydrate favorites for the restored session.
          useFavoritesStore.getState().loadFavorites().catch(() => {});
          return;
        }
      }

      set({ token: null, user: null, profile: null, isAuthenticated: false, isLoading: false });
    } catch (err) {
      console.warn('Auth initialize error:', err);
      set({ token: null, user: null, profile: null, isAuthenticated: false, isLoading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/auth/login', { email, password });

      if (!res.success || !res.data) {
        set({ isLoading: false });
        return { error: res.message || 'Login failed' };
      }

      const { token, user } = res.data;
      const userProfile: UserProfile = {
        id: user.id || user.UserID,
        fullName: user.fullName || user.FullName || 'User',
        email: user.email || user.Email,
        phone: user.phone || user.Phone,
        role: user.role || user.Role || 'customer',
      };

      await api.setToken(token);
      set({
        token,
        user: userProfile,
        profile: userProfile,
        isAuthenticated: true,
        isLoading: false,
      });

      // Account isolation: never let a cart persisted for a previous session
      // leak into a different account. (Logout also clears it.)
      useCartStore.getState().clearCart();

      // Best-effort: load this user's favorites for the new session.
      useFavoritesStore.getState().loadFavorites().catch(() => {});

      return { error: null, role: userProfile.role };
    } catch (e: any) {
      set({ isLoading: false });
      return { error: e?.message || 'Login failed' };
    }
  },

  signUp: async (email, password, fullName, phone) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/auth/register', {
        fullName,
        email,
        password,
        phone,
      });

      if (!res.success) {
        set({ isLoading: false });
        return { error: res.message || 'Registration failed' };
      }

      // Automatically sign in after registration if token provided
      if (res.data?.token) {
        const { token, user } = res.data;
        const userProfile: UserProfile = {
          id: user.id || user.UserID,
          fullName: user.fullName || user.FullName,
          email: user.email || user.Email,
          phone: user.phone || user.Phone,
          role: 'customer',
        };
        await api.setToken(token);
        set({ token, user: userProfile, profile: userProfile, isAuthenticated: true, isLoading: false });
        // Account isolation: new/other account starts with a clean cart.
        useCartStore.getState().clearCart();
        // Best-effort: new accounts start with no favorites, but keep the store in sync.
        useFavoritesStore.getState().loadFavorites().catch(() => {});
      } else {
        set({ isLoading: false });
      }

      return { error: null };
    } catch (e: any) {
      set({ isLoading: false });
      return { error: e?.message || 'Registration failed' };
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      await api.removeToken();
      useCartStore.getState().clearCart();
      useFavoritesStore.getState().setFavoriteIds([]);
      set({ token: null, user: null, profile: null, isAuthenticated: false, isLoading: false });
      router.replace('/(auth)/login');
    } catch {
      useCartStore.getState().clearCart();
      useFavoritesStore.getState().setFavoriteIds([]);
      set({ token: null, user: null, profile: null, isAuthenticated: false, isLoading: false });
      router.replace('/(auth)/login');
    }
  },

  refreshProfile: async () => {
    const profile = await authService.getProfile();
    if (profile) {
      set({ user: profile, profile });
    }
  },

  updateProfile: async (fullName: string, phone: string, address?: string) => {
    const res = await authService.updateProfile(fullName, phone, address);
    if (!res.error) {
      const current = get().profile;
      if (current) {
        const updated = { ...current, fullName, phone, address };
        set({ user: updated, profile: updated });
      }
    }
    return res;
  },
}));
