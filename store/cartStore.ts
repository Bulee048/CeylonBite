import { create } from 'zustand';

export interface ExtraItem {
  id: string;
  name: string;
  price: number;
}

export interface StoreCartItem {
  id: string; // Unique id: foodId + spice + sorted extras ids
  foodId: string;
  name: string;
  image: string;
  basePrice: number;
  quantity: number;
  selectedSpice: string;
  extras: ExtraItem[];
  specialInstructions?: string;
  unitTotal: number; // basePrice + sum(extras)
}

interface CartStore {
  items: StoreCartItem[];
  addItem: (item: Omit<StoreCartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

// Unique ID generator for customized items
const generateCartItemId = (
  foodId: string,
  spice: string,
  extras: ExtraItem[]
): string => {
  const sortedExtras = [...extras].map((e) => e.id).sort().join('-');
  return `${foodId}_${spice}_${sortedExtras}`;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (newItemData) => {
    const id = generateCartItemId(
      newItemData.foodId,
      newItemData.selectedSpice,
      newItemData.extras
    );

    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.id === id);

      if (existingIndex > -1) {
        // Increment quantity of existing customized item
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + newItemData.quantity,
          specialInstructions: newItemData.specialInstructions || updatedItems[existingIndex].specialInstructions,
        };
        return { items: updatedItems };
      } else {
        // Add new customized item
        const newItem: StoreCartItem = {
          ...newItemData,
          id,
        };
        return { items: [...state.items, newItem] };
      }
    });
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  increaseQuantity: (id) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      ),
    }));
  },

  decreaseQuantity: (id) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  getSubtotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.unitTotal * item.quantity,
      0
    );
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
