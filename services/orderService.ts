import { api } from './api';
import { DetailedOrder, TrackStatus } from '../data/mockOrders';
import { mockDetailedOrders } from '../data/mockOrders';

export const orderService = {
  async createOrder(params: {
    userId: string | number;
    customerName: string;
    customerPhone?: string;
    deliveryAddress: string;
    deliveryInstructions?: string;
    orderType: 'delivery' | 'pickup';
    paymentMethod: 'cash' | 'card' | 'wallet';
    items: any[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
  }): Promise<{ orderId: string | null; orderNumber: string | null; error: string | null }> {
    const res = await api.post('/orders', params);
    if (res.success && res.data) {
      return {
        orderId: String(res.data.id || res.data.OrderID || '1'),
        orderNumber: res.data.orderNumber || res.data.OrderNumber || `CB${Math.floor(1000 + Math.random() * 9000)}`,
        error: null,
      };
    }
    return { orderId: null, orderNumber: null, error: res.message || 'Order creation failed' };
  },

  async getUserOrders(userId?: string | number): Promise<DetailedOrder[]> {
    try {
      const res = await api.get('/orders/my');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((ord: any) => ({
          id: ord.order_number || ord.OrderNumber || String(ord.id || ord.OrderID),
          customerName: ord.customer_name || ord.CustomerName || 'Customer',
          orderType: ord.order_type === 'delivery' ? 'Home Delivery' : 'Store Pickup',
          createdAt: new Date(ord.created_at || ord.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: ord.status === 'delivered' || ord.status === 'cancelled' ? 'past' : 'active',
          status: ord.status as TrackStatus,
          statusText: `Status: ${ord.status}`,
          placedTime: new Date(ord.created_at || ord.CreatedAt).toLocaleString(),
          estimatedDelivery: '25–30 min',
          deliveryType: ord.order_type === 'delivery' ? 'Home Delivery' : 'Store Pickup',
          deliveryAddress: ord.delivery_address || ord.DeliveryAddress || '',
          paymentMethod: ord.payment_method || ord.PaymentMethod || 'cash',
          subtotal: Number(ord.subtotal || ord.Subtotal || 0),
          deliveryFee: Number(ord.delivery_fee || ord.DeliveryFee || 0),
          discount: Number(ord.discount || ord.Discount || 0),
          total: Number(ord.total || ord.Total || 0),
          totalAmount: Number(ord.total || ord.Total || 0),
          items: (ord.items || []).map((item: any) => ({
            foodId: String(item.food_id || item.FoodID || '1'),
            name: item.food_name || item.FoodName,
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
            quantity: item.quantity || item.Quantity,
            unitPrice: Number(item.unit_total || item.UnitTotal || item.base_price || item.BasePrice),
            customization: item.selected_spice || item.SelectedSpice || '',
          })),
        }));
      }
      return mockDetailedOrders;
    } catch {
      return mockDetailedOrders;
    }
  },

  async getAllOrders(): Promise<DetailedOrder[]> {
    try {
      const res = await api.get('/admin/orders');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((ord: any) => ({
          id: ord.order_number || ord.OrderNumber || String(ord.id || ord.OrderID),
          customerName: ord.customer_name || ord.CustomerName || 'Customer',
          orderType: ord.order_type || ord.OrderType,
          createdAt: new Date(ord.created_at || ord.CreatedAt).toLocaleString(),
          type: ord.status === 'delivered' || ord.status === 'cancelled' ? 'past' : 'active',
          status: ord.status as TrackStatus,
          statusText: `Status: ${ord.status}`,
          placedTime: new Date(ord.created_at || ord.CreatedAt).toLocaleString(),
          estimatedDelivery: '25-30 min',
          deliveryType: ord.order_type === 'delivery' ? 'Home Delivery' : 'Store Pickup',
          deliveryAddress: ord.delivery_address || ord.DeliveryAddress || '',
          paymentMethod: ord.payment_method || ord.PaymentMethod || 'cash',
          subtotal: Number(ord.subtotal || ord.Subtotal || 0),
          deliveryFee: Number(ord.delivery_fee || ord.DeliveryFee || 0),
          discount: Number(ord.discount || ord.Discount || 0),
          total: Number(ord.total || ord.Total || 0),
          totalAmount: Number(ord.total || ord.Total || 0),
          items: (ord.items || []).map((item: any) => ({
            foodId: String(item.food_id || item.FoodID || '1'),
            name: item.food_name || item.FoodName,
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
            quantity: item.quantity || item.Quantity,
            unitPrice: Number(item.unit_total || item.UnitTotal),
            customization: item.selected_spice || item.SelectedSpice || '',
          })),
        }));
      }
      return mockDetailedOrders;
    } catch {
      return mockDetailedOrders;
    }
  },

  async updateOrderStatus(orderId: string, newStatus: TrackStatus): Promise<{ error: string | null }> {
    const res = await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
    if (!res.success) return { error: res.message || 'Failed to update status' };
    return { error: null };
  },
};
