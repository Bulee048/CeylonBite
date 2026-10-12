import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ExtraItem,
  StoreCartItem,
  CART_STORAGE_KEY,
  CART_PERSIST_VERSION,
  sanitizeCartItems,
  sanitizeExtras,
  computeSubtotal,
  computeItemCount,
  generateCartItemId,
  toSafeFiniteNumber,
} from '../utils/cart';

export type { ExtraItem, StoreCartItem } from '../utils/cart';
export {
  CART_STORAGE_KEY,
  CART_PERSIST_VERSION,
  sanitizeCartItems,
} from '../utils/cart';

interface CartStore {
  items: StoreCartItem[];
  // True once persisted state has been read (or a read has failed). Consumers
  // use this to avoid flashing an empty cart before hydration completes.
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addItem: (item: Omit<StoreCartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

      addItem: (newItemData) => {
        // Sanitize numeric input so quantity can never be 0/negative/NaN and the
        // unit total is always a finite number.
        const safeQuantity =
          Number.isFinite(newItemData.quantity) && newItemData.quantity > 0
            ? Math.floor(newItemData.quantity)
            : 1;
        // Extras are re-sanitized (server price wins at checkout regardless).
        const safeExtras = sanitizeExtras(newItemData.extras);
        const extrasSum = safeExtras.reduce((sum, e) => sum + e.price, 0);
        const basePrice = toSafeFiniteNumber(newItemData.basePrice, 0);
        const safeUnitTotal = Number.isFinite(newItemData.unitTotal)
          ? newItemData.unitTotal
          : basePrice + extrasSum;

        const id = generateCartItemId(
          newItemData.foodId,
          newItemData.selectedSpice,
          safeExtras
        );

        set((state) => {
          const existingIndex = state.items.findIndex((item) => item.id === id);

          if (existingIndex > -1) {
            // Increment quantity of existing customized item
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + safeQuantity,
              specialInstructions:
                newItemData.specialInstructions ||
                updatedItems[existingIndex].specialInstructions,
            };
            return { items: updatedItems };
          } else {
            // Add new customized item
            const newItem: StoreCartItem = {
              ...newItemData,
              basePrice,
              extras: safeExtras,
              unitTotal: safeUnitTotal,
              quantity: safeQuantity,
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

      getSubtotal: () => computeSubtotal(get().items),

      getItemCount: () => computeItemCount(get().items),
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_PERSIST_VERSION,
      // AsyncStorage is backed by localStorage on web, so a single adapter
      // works for both native and web.
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
      // Validate/repair persisted data on the way in (corrupt storage, legacy
      // shapes, tampered values). Never trust local storage.
      migrate: (persistedState) => {
        const persisted = persistedState as { items?: unknown } | undefined;
        return { items: sanitizeCartItems(persisted?.items) } as any;
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { items?: unknown } | undefined;
        return {
          ...currentState,
          items: sanitizeCartItems(persisted?.items),
        };
      },
      // Mark hydration complete (on success OR failure) so the UI can leave the
      // "restoring cart" state. Referenced lazily to avoid a TDZ error.
      onRehydrateStorage: () => () => {
        useCartStore.setState({ hasHydrated: true });
      },
    }
  )
);
