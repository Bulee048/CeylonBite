export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
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

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';

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
