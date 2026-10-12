// ---------------------------------------------------------------------------
// Pure cart domain logic.
//
// This module intentionally has NO React Native / Zustand / AsyncStorage
// imports so it can be unit-tested in plain Node. Both the cart store and the
// persistence layer rely on it, which keeps the "trust no local data" rules in
// one place.
// ---------------------------------------------------------------------------

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

export const CART_STORAGE_KEY = 'ceylonbite_cart_v1';
export const CART_PERSIST_VERSION = 1;

// Extras used to be hardcoded on the client with ids ex-1/ex-2/ex-3. They now
// come from the server-side Extras catalog (1/2/3). Mapping the legacy ids
// lets a cart persisted by an older app version keep working after upgrade.
export const LEGACY_EXTRA_ID_MAP: Record<string, string> = {
  'ex-1': '1',
  'ex-2': '2',
  'ex-3': '3',
};

export const toSafeString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return fallback;
  return String(value);
};

export const toSafeFiniteNumber = (value: unknown, fallback = 0): number => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

// Unique ID generator for customized items. Never throws.
export const generateCartItemId = (
  foodId: string,
  spice: string,
  extras: ExtraItem[]
): string => {
  const safeExtras = Array.isArray(extras) ? extras : [];
  const sortedExtras = safeExtras
    .map((e) => toSafeString(e && e.id))
    .filter(Boolean)
    .sort()
    .join('-');
  return `${foodId}_${spice}_${sortedExtras}`;
};

// Sanitize a single persisted extra entry. Returns null when unusable.
export const sanitizeExtra = (raw: unknown): ExtraItem | null => {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  let id = toSafeString(source.id).trim();
  if (!id) return null;
  id = LEGACY_EXTRA_ID_MAP[id] || id;

  // Local prices are never trusted: negative / NaN / non-finite -> drop.
  const price = toSafeFiniteNumber(source.price, 0);
  if (price < 0) return null;

  return {
    id,
    name: toSafeString(source.name, id).trim() || id,
    price,
  };
};

export const sanitizeExtras = (raw: unknown): ExtraItem[] => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: ExtraItem[] = [];
  for (const entry of raw) {
    const extra = sanitizeExtra(entry);
    if (!extra) continue;
    if (seen.has(extra.id)) continue; // de-duplicate identical extras
    seen.add(extra.id);
    result.push(extra);
  }
  return result;
};

// Sanitize the full persisted cart. Anything malformed is dropped or clamped;
// this function never throws, so corrupted storage can never crash the app.
export const sanitizeCartItems = (raw: unknown): StoreCartItem[] => {
  if (!Array.isArray(raw)) return [];
  const result: StoreCartItem[] = [];
  const byId = new Map<string, StoreCartItem>();

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const source = entry as Record<string, unknown>;

    const foodId = toSafeString(source.foodId).trim();
    if (!foodId) continue; // a cart line without a food id is unusable

    const quantity = Math.max(1, Math.floor(toSafeFiniteNumber(source.quantity, 1)));
    const basePrice = Math.max(0, toSafeFiniteNumber(source.basePrice, 0));
    const selectedSpice = toSafeString(source.selectedSpice, 'Ceylon Spicy').trim() || 'Ceylon Spicy';
    const extras = sanitizeExtras(source.extras);
    const extrasSum = extras.reduce((sum, e) => sum + e.price, 0);
    const unitTotal = Math.max(
      0,
      toSafeFiniteNumber(source.unitTotal, basePrice + extrasSum)
    );

    const rawId = toSafeString(source.id).trim();
    const id = rawId || generateCartItemId(foodId, selectedSpice, extras);

    const existing = byId.get(id);
    if (existing) {
      // Collapse duplicate lines instead of showing the same item twice.
      existing.quantity += quantity;
      continue;
    }

    const item: StoreCartItem = {
      id,
      foodId,
      name: toSafeString(source.name, 'Item').trim() || 'Item',
      image: toSafeString(source.image),
      basePrice,
      quantity,
      selectedSpice,
      extras,
      specialInstructions:
        typeof source.specialInstructions === 'string' ? source.specialInstructions : undefined,
      unitTotal,
    };
    byId.set(id, item);
    result.push(item);
  }

  return result;
};

// Compute the subtotal defensively (never returns NaN/negative).
export const computeSubtotal = (items: StoreCartItem[]): number => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const unit = toSafeFiniteNumber(item && item.unitTotal, 0);
    const qty = toSafeFiniteNumber(item && item.quantity, 0);
    return sum + (unit > 0 ? unit : 0) * (qty > 0 ? qty : 0);
  }, 0);
};

// Compute the total item count defensively.
export const computeItemCount = (items: StoreCartItem[]): number => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const qty = toSafeFiniteNumber(item && item.quantity, 0);
    return sum + (qty > 0 ? Math.floor(qty) : 0);
  }, 0);
};
