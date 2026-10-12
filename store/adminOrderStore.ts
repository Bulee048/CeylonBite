import { create } from 'zustand';
import { DetailedOrder, TrackStatus } from '../types';

interface AdminOrderStore {
  orders: DetailedOrder[];
  setOrders: (orders: DetailedOrder[]) => void;
  updateOrderStatus: (id: string, newStatus: TrackStatus) => void;
  getOrderById: (id: string) => DetailedOrder | undefined;
}

export const useAdminOrderStore = create<AdminOrderStore>((set, get) => ({
  orders: [],

  setOrders: (orders) => set({ orders }),

  updateOrderStatus: (id, newStatus) => {
    set((state) => ({
      orders: state.orders.map((order) => {
        if (order.id === id || order.id === `CB${id}`) {
          const isNowPast = newStatus === 'delivered' || newStatus === 'cancelled';
          return {
            ...order,
            status: newStatus,
            type: isNowPast ? 'past' : 'active',
          };
        }
        return order;
      }),
    }));
  },

  getOrderById: (id) => {
    return get().orders.find((o) => o.id === id || o.id === `CB${id}`);
  },
}));
