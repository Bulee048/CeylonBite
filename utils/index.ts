// Helper utility functions (e.g. price formatters, date formatters)
export const formatLKR = (amount: number): string => {
  return `LKR ${amount.toLocaleString()}`;
};

// ---------------------------------------------------------------------------
// Phone helpers
// ---------------------------------------------------------------------------
// Normalize a Sri Lankan phone number by stripping formatting characters so
// user-entered values like "+94 77 123 4567" or "077-123 4567" validate.
export const normalizePhone = (raw: string): string =>
  (raw || '').replace(/[\s\-().]/g, '');

// Accepts local (0XXXXXXXXX), international (+94XXXXXXXXX) and 94XXXXXXXXX.
export const isValidSriLankanPhone = (raw: string): boolean => {
  const p = normalizePhone(raw);
  return /^(?:\+94|94|0)\d{9}$/.test(p);
};

// Convert any accepted form to the canonical local "0XXXXXXXXX" format before
// sending it to the API so the stored contract is consistent.
export const toCanonicalPhone = (raw: string): string => {
  const p = normalizePhone(raw);
  if (/^0\d{9}$/.test(p)) return p;
  if (/^(?:\+94|94)\d{9}$/.test(p)) {
    return `0${p.replace(/^(?:\+94|94)/, '')}`;
  }
  return p;
};

// ---------------------------------------------------------------------------
// Email helper (kept identical on client and server)
// ---------------------------------------------------------------------------
export const isValidEmail = (raw: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((raw || '').trim());
