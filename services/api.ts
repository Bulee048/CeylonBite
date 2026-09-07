import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

const TOKEN_KEY = 'ceylonbite_jwt_token';

export const api = {
  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
      }
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      }
    } catch (e) {
      console.warn('Failed to save auth token:', e);
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.warn('Failed to remove auth token:', e);
    }
  },

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; message?: string }> {
    try {
      const token = await api.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, message: json.message || 'Request failed' };
      }

      return json;
    } catch (error: any) {
      return { success: false, message: error?.message || 'Network error connecting to API' };
    }
  },

  get<T = any>(endpoint: string) {
    return api.request<T>(endpoint, { method: 'GET' });
  },

  post<T = any>(endpoint: string, body?: any) {
    return api.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
  },

  put<T = any>(endpoint: string, body?: any) {
    return api.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  },

  patch<T = any>(endpoint: string, body?: any) {
    return api.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
  },

  delete<T = any>(endpoint: string) {
    return api.request<T>(endpoint, { method: 'DELETE' });
  },
};
