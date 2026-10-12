import { api } from '../services/api';
import { UserRole, Customer } from '../types';

export interface UserProfile {
  id: string | number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
}

export const authService = {
  async getProfile(): Promise<UserProfile | null> {
    const res = await api.get('/auth/me');
    if (res.success && res.data) {
      return {
        id: res.data.id || res.data.userId,
        fullName: res.data.fullName || res.data.full_name,
        email: res.data.email,
        phone: res.data.phone,
        address: res.data.address || res.data.Address || '',
        role: res.data.role,
      };
    }
    return null;
  },

  async updateProfile(fullName: string, phone: string, address?: string): Promise<{ error: string | null }> {
    const res = await api.put('/auth/profile', { fullName, phone, address });
    if (!res.success) {
      return { error: res.message || 'Failed to update profile' };
    }
    return { error: null };
  },

  async getAllCustomers(): Promise<Customer[]> {
    const res = await api.get('/admin/customers');
    if (res.success && Array.isArray(res.data)) {
      return res.data.map((c: any) => ({
        id: String(c.id || c.UserID),
        name: c.fullName || c.FullName,
        email: c.email || c.Email,
        phone: c.phone || c.Phone || '',
        ordersCount: c.orderCount || c.OrdersCount || 0,
        totalSpent: Number(c.totalSpent || c.TotalSpent || 0),
        status: c.isActive !== false ? 'Active' : 'Inactive',
      }));
    }
    throw new Error(res.message || 'Failed to load customers from server');
  },
};
