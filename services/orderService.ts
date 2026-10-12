import { api } from './api';
import { DetailedOrder, TrackStatus } from '../types';

export interface CreateOrderResult {
  orderId: string | null;
  orderNumber: string | null;
  subtotal: number | null;
  deliveryFee: number | null;
  discount: number | null;
  total: number | null;
  promoCode: string | null;
  error: string | null;
}

export const orderService = {
  async createOrder(params: {
    userId: string | number;
    customerName: string;
    customerPhone?: string;
    deliveryAddress: string;
    deliveryInstructions?: string;
    orderType: 'delivery' | 'pickup';
    paymentMethod: 'cash' | 'card' | 'wallet';
    promoCode?: string;
    items: any[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
  }): Promise<CreateOrderResult> {
    const res = await api.post('/orders', params);
    if (res.success && res.data && res.data.orderNumber) {
      const num = (v: any): number | null => {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      return {
        orderId: res.data.id !== undefined && res.data.id !== null ? String(res.data.id) : null,
        orderNumber: String(res.data.orderNumber),
        // Server-authoritative figures. The client uses these (not its own
        // estimate) for the confirmation screen.
        subtotal: num(res.data.subtotal),
        deliveryFee: num(res.data.deliveryFee),
        discount: num(res.data.discount),
        total: num(res.data.total),
        promoCode: res.data.promoCode ?? null,
        error: null,
      };
    }
    // Never fabricate a confirmation. If the server did not return a real
    // orderNumber, treat the order as unconfirmed.
    return {
      orderId: null,
      orderNumber: null,
      subtotal: null,
      deliveryFee: null,
      discount: null,
      total: null,
      promoCode: null,
      error:
        res.message ||
        'The server did not confirm your order. Please check your order history before retrying.',
    };
  },

  async getUserOrders(userId?: string | number): Promise<DetailedOrder[]> {
    const res = await api.get('/orders/my');
    if (res.success && Array.isArray(res.data)) {
      return res.data.map((ord: any) => ({
          id: ord.order_number || ord.OrderNumber || String(ord.id || ord.OrderID),
          customerName: ord.customer_name || ord.CustomerName || 'Customer',
          orderType: ord.order_type === 'delivery' ? 'Home Delivery' : 'Store Pickup',
          createdAt: new Date(ord.created_at || ord.CreatedAt).toLocaleString([], { hour: '2-digit', minute: '2-digit' }),
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
    // Throw so the UI can surface a real error instead of showing an empty list.
    throw new Error(res.message || 'Failed to load your orders from the server.');
  },

  async getOrderById(id: string): Promise<DetailedOrder | null> {
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.success && res.data) {
        const ord = res.data;
        return {
          id: ord.order_number || ord.OrderNumber || String(ord.id || ord.OrderID),
          customerName: ord.customer_name || ord.CustomerName || 'Customer',
          orderType: ord.order_type === 'delivery' ? 'Home Delivery' : 'Store Pickup',
          createdAt: new Date(ord.created_at || ord.CreatedAt).toLocaleString(),
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
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  async getAllOrders(): Promise<DetailedOrder[]> {
    const res = await api.get('/admin/orders');
    if (res.success && Array.isArray(res.data)) {
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
    // Throw error so the UI can display it instead of silently showing empty
    throw new Error(res.message || 'Failed to load orders from server');
  },

  async updateOrderStatus(orderId: string, newStatus: TrackStatus): Promise<{ error: string | null }> {
    const res = await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
    if (!res.success) return { error: res.message || 'Failed to update status' };
    return { error: null };
  },
};
