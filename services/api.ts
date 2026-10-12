import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Prefer an explicit environment URL (see .env.example). Fall back to a
// platform-correct development default so an Android emulator never silently
// points at the emulator's own localhost.
const DEFAULT_API_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5001/api' // Android emulator loopback to the host machine
    : 'http://localhost:5001/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

const TOKEN_KEY = 'ceylonbite_jwt_token';

let unauthorizedHandler: (() => void) | null = null;
let isRedirecting401 = false;

export const setUnauthorizedHandler = (handler: () => void) => {
  unauthorizedHandler = handler;
};

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

      // Defensive parse: proxies/gateways may return an empty or non-JSON body.
      const raw = await res.text();
      let json: any = {};
      if (raw) {
        try {
          json = JSON.parse(raw);
        } catch {
          json = { message: `Unexpected non-JSON response from server (status ${res.status}).` };
        }
      }

      if (!res.ok) {
        if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
          if (!isRedirecting401) {
            isRedirecting401 = true;
            if (unauthorizedHandler) {
              unauthorizedHandler();
            }
            setTimeout(() => {
              isRedirecting401 = false;
            }, 3000);
          }
        }
        return { success: false, message: json.message || `Request failed (status ${res.status})` };
      }

      // Successful responses carry an explicit `success` flag; synthesise it for
      // the rare empty/successful body so callers can rely on the shape.
      if (json && typeof json === 'object' && json.success === undefined) {
        return { success: true, data: json } as any;
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
