import { mockFoodItems } from './mockData';

export interface DetailOrderItem {
  foodId: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  customization?: string;
}

export type TrackStatus = 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

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

export const mockDetailedOrders: DetailedOrder[] = [
  {
    id: 'CB1025',
    customerName: 'Dulmin Silva',
    orderType: 'Delivery',
    createdAt: 'Today, 6:12 PM',
    type: 'active',
    status: 'preparing',
    statusText: 'Our kitchen is preparing your meal',
    placedTime: 'Today, 6:12 PM',
    estimatedDelivery: '25–30 min',
    deliveryType: 'Home Delivery',
    deliveryAddress: 'No. 25, Galle Road, Colombo 03, Sri Lanka',
    paymentMethod: 'Cash on Delivery',
    items: [
      {
        foodId: 'f1',
        name: 'Ceylon Crunch Burger',
        image: mockFoodItems[0].image,
        quantity: 2,
        unitPrice: 1740, // 1490 + 250 extra cheese
        customization: 'Ceylon Spicy, Extra Cheese',
      },
      {
        foodId: 'f2',
        name: 'Spicy Chicken Bucket',
        image: mockFoodItems[1].image,
        quantity: 1,
        unitPrice: 3850,
        customization: 'Signature Spices',
      },
    ],
    subtotal: 7330,
    deliveryFee: 350,
    discount: 1466, // 20% promo discount
    total: 6214,
    totalAmount: 6214,
  },
  {
    id: 'CB1020',
    customerName: 'Kavindi Perera',
    orderType: 'Delivery',
    createdAt: 'Today, 7:05 PM',
    type: 'active',
    status: 'confirmed',
    statusText: 'Your order has been received by restaurant',
    placedTime: 'Today, 7:05 PM',
    estimatedDelivery: '20–25 min',
    deliveryType: 'Home Delivery',
    deliveryAddress: 'No. 25, Galle Road, Colombo 03, Sri Lanka',
    paymentMethod: 'Credit / Debit Card',
    items: [
      {
        foodId: 'f3',
        name: 'Hot Butter Chicken Rice',
        image: mockFoodItems[2].image,
        quantity: 1,
        unitPrice: 1890,
        customization: 'Extra Hot',
      },
      {
        foodId: 'f8',
        name: 'Lime Mojito',
        image: mockFoodItems[7].image,
        quantity: 1,
        unitPrice: 650,
      },
    ],
    subtotal: 2540,
    deliveryFee: 350,
    discount: 0,
    total: 2890,
    totalAmount: 2890,
  },
  {
    id: 'CB0988',
    customerName: 'Kasun Jayawardena',
    orderType: 'Pickup',
    createdAt: 'Yesterday, 8:15 PM',
    type: 'past',
    status: 'delivered',
    statusText: 'Enjoy your CeylonBite meal',
    placedTime: 'Yesterday, 8:15 PM',
    estimatedDelivery: 'Delivered',
    deliveryType: 'Store Pickup',
    deliveryAddress: 'Store Pickup: Colombo 03 Flagship',
    paymentMethod: 'Cash on Delivery',
    items: [
      {
        foodId: 'f2',
        name: 'Spicy Chicken Bucket',
        image: mockFoodItems[1].image,
        quantity: 1,
        unitPrice: 3850,
      },
      {
        foodId: 'f7',
        name: 'Chocolate Lava Cake',
        image: mockFoodItems[6].image,
        quantity: 2,
        unitPrice: 850,
      },
    ],
    subtotal: 5550,
    deliveryFee: 0,
    discount: 550,
    total: 5000,
    totalAmount: 5000,
  },
  {
    id: 'CB0912',
    customerName: 'Nimesha Fernando',
    orderType: 'Delivery',
    createdAt: 'Sep 02, 2026',
    type: 'past',
    status: 'delivered',
    statusText: 'Enjoy your CeylonBite meal',
    placedTime: 'Sep 02, 2026',
    estimatedDelivery: 'Delivered',
    deliveryType: 'Home Delivery',
    deliveryAddress: 'No. 12, Main Street, Colombo 04, Sri Lanka',
    paymentMethod: 'CeylonBite Wallet',
    items: [
      {
        foodId: 'f4',
        name: 'BBQ Chicken Pizza',
        image: mockFoodItems[3].image,
        quantity: 1,
        unitPrice: 2650,
      },
    ],
    subtotal: 2650,
    deliveryFee: 350,
    discount: 0,
    total: 3000,
    totalAmount: 3000,
  },
  {
    id: 'CB0850',
    customerName: 'Dulmin Silva',
    orderType: 'Delivery',
    createdAt: 'Aug 28, 2026',
    type: 'past',
    status: 'cancelled',
    statusText: 'Order was cancelled',
    placedTime: 'Aug 28, 2026',
    estimatedDelivery: 'Cancelled',
    deliveryType: 'Home Delivery',
    deliveryAddress: 'No. 25, Galle Road, Colombo 03, Sri Lanka',
    paymentMethod: 'Cash on Delivery',
    items: [
      {
        foodId: 'f5',
        name: 'Crispy Chicken Wrap',
        image: mockFoodItems[4].image,
        quantity: 2,
        unitPrice: 1250,
      },
    ],
    subtotal: 2500,
    deliveryFee: 350,
    discount: 0,
    total: 2850,
    totalAmount: 2850,
  },
];
