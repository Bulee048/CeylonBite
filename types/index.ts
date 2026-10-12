export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ordersCount: number;
  totalSpent: number;
  status: 'Active' | 'Inactive';
}

export interface Category {
  id: string;
  name: string;
  iconName: string; // Ionicons name
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number; // in LKR
  image: string;
  categoryId: string;
  rating: number;
  isAvailable: boolean;
  isPopular: boolean;
  calories?: string;
  prepTime?: string;
}

export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface OrderItem {
  foodItemId: string;
  foodName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalAmount: number; // in LKR
  status: OrderStatus;
  createdAt: string;
}

// ---------- Order tracking & admin order detail model ----------

export type TrackStatus = OrderStatus;

export interface DetailOrderItem {
  foodId: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  customization?: string;
}

export interface DetailedOrder {
  id: string; // e.g. CB1025
  customerName?: string;
  customerPhone?: string;
  orderType?: string;
  createdAt?: string;
  type: 'active' | 'past';
  status: TrackStatus;
  statusText: string;
  placedTime: string;
  estimatedDelivery: string;
  deliveryType: 'Home Delivery' | 'Store Pickup';
  deliveryAddress: string;
  paymentMethod: string;
  items: DetailOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  totalAmount?: number;
}
