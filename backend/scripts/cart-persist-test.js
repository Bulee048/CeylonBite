/* eslint-disable */
// CeylonBite — CART PERSISTENCE / HYDRATION UNIT TESTS.
//
// The cart is persisted to AsyncStorage (localStorage on web) via zustand's
// persist middleware. This test exercises the pure sanitizer that runs on every
// restore (utils/cart.ts) plus a simulated serialize -> corrupt -> restore
// round-trip. It needs NO server and NO database.
//
// Run from the backend/ directory:  node scripts/cart-persist-test.js
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

const CART_TS = path.join(__dirname, '..', '..', 'utils', 'cart.ts');

// Transpile the pure TS module to CommonJS in-memory (no bundler required).
function loadCartModule() {
  const source = fs.readFileSync(CART_TS, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
    },
    fileName: 'cart.ts',
  });
  const m = new Module(CART_TS, module);
  m.filename = CART_TS;
  m.paths = Module._nodeModulePaths(path.dirname(CART_TS));
  m._compile(outputText, CART_TS);
  return m.exports;
}

const cart = loadCartModule();

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} :: ${detail}`);
};

// ---------------------------------------------------------------------------
const validItem = () => ({
  id: '5_Ceylon Spicy_1-2',
  foodId: '5',
  name: 'Ceylon Crunch Burger',
  image: 'https://img/x.jpg',
  basePrice: 1250,
  quantity: 2,
  selectedSpice: 'Ceylon Spicy',
  extras: [
    { id: '1', name: 'Extra Cheese', price: 250 },
    { id: '2', name: 'Extra Chicken', price: 450 },
  ],
  specialInstructions: 'no onions',
  unitTotal: 1950,
});

function main() {
  // 1. Valid data survives a serialize/deserialize round-trip unchanged.
  const roundTrip = cart.sanitizeCartItems(JSON.parse(JSON.stringify([validItem()])));
  check(
    'valid round-trip preserved',
    roundTrip.length === 1 &&
      roundTrip[0].foodId === '5' &&
      roundTrip[0].quantity === 2 &&
      roundTrip[0].extras.length === 2 &&
      roundTrip[0].unitTotal === 1950,
    `len=${roundTrip.length} qty=${roundTrip[0] && roundTrip[0].quantity}`
  );

  // 2. Never throws on arbitrary / corrupt input (app must not crash).
  let threw = false;
  try {
    [null, undefined, 'not-json', 42, true, {}, [], [null, 0, 'x', []]].forEach((v) =>
      cart.sanitizeCartItems(v)
    );
  } catch (e) {
    threw = true;
  }
  check('never throws on corrupt input', !threw, `threw=${threw}`);
  check('non-array -> empty cart', cart.sanitizeCartItems('garbage').length === 0, 'ok');

  // 3. Lines without a usable foodId are dropped.
  const noFood = cart.sanitizeCartItems([
    { ...validItem(), foodId: '' },
    { ...validItem(), foodId: undefined },
    validItem(),
  ]);
  check('missing foodId dropped', noFood.length === 1, `len=${noFood.length} (expected 1)`);

  // 4. Quantity NaN / negative / zero / fractional is clamped to a positive int.
  const qty = cart.sanitizeCartItems([
    { ...validItem(), id: 'a', quantity: NaN },
    { ...validItem(), id: 'b', quantity: -7 },
    { ...validItem(), id: 'c', quantity: 0 },
    { ...validItem(), id: 'd', quantity: 2.9 },
  ]);
  check(
    'quantity clamped to positive integer',
    qty.every((i) => Number.isInteger(i.quantity) && i.quantity >= 1),
    `qtys=${qty.map((i) => i.quantity).join(',')}`
  );

  // 5. Prices can never be negative / NaN / Infinity.
  const prices = cart.sanitizeCartItems([
    { ...validItem(), id: 'p1', basePrice: -100, unitTotal: -5 },
    { ...validItem(), id: 'p2', basePrice: NaN, unitTotal: NaN },
    { ...validItem(), id: 'p3', basePrice: Infinity, unitTotal: Infinity },
  ]);
  check(
    'prices never negative/non-finite',
    prices.every(
      (i) =>
        Number.isFinite(i.basePrice) &&
        i.basePrice >= 0 &&
        Number.isFinite(i.unitTotal) &&
        i.unitTotal >= 0
    ),
    `prices=${prices.map((i) => `${i.basePrice}/${i.unitTotal}`).join(',')}`
  );

  // 6. Extras: negative / NaN prices are dropped; duplicates de-duped.
  const extras = cart.sanitizeExtras([
    { id: '1', name: 'Cheese', price: 250 },
    { id: '1', name: 'Cheese', price: 250 }, // duplicate
    { id: '2', name: 'Neg', price: -50 }, // dropped
    { id: '3', name: 'NaN', price: 'abc' }, // priced -> 0, kept
    { name: 'no id' }, // dropped
    null,
  ]);
  check(
    'extras sanitized (dedupe + drop bad)',
    extras.length === 2 &&
      extras[0].id === '1' &&
      extras[1].id === '3' &&
      extras[1].price === 0,
    `extras=${extras.map((e) => `${e.id}:${e.price}`).join('|')}`
  );

  // 7. Legacy client-only extra ids (ex-1/ex-2/ex-3) are remapped to DB ids.
  const legacy = cart.sanitizeExtras([{ id: 'ex-1', name: 'Extra Cheese', price: 250 }]);
  check('legacy extra id remapped', legacy.length === 1 && legacy[0].id === '1', `id=${legacy[0] && legacy[0].id}`);

  // 8. Duplicate cart lines (same id) collapse into one with summed quantity.
  const dup = cart.sanitizeCartItems([
    { ...validItem(), id: 'same', quantity: 1 },
    { ...validItem(), id: 'same', quantity: 3 },
  ]);
  check('duplicate lines merged', dup.length === 1 && dup[0].quantity === 4, `len=${dup.length} qty=${dup[0] && dup[0].quantity}`);

  // 9. Derived totals ignore NaN / negatives and never produce NaN.
  const subtotal = cart.computeSubtotal([
    { ...validItem(), quantity: 2, unitTotal: 1000 },
    { ...validItem(), quantity: NaN, unitTotal: 9999 },
    { ...validItem(), quantity: 3, unitTotal: NaN },
    null,
  ]);
  check('computeSubtotal defensive', subtotal === 2000, `subtotal=${subtotal} (expected 2000)`);

  const count = cart.computeItemCount([
    { ...validItem(), quantity: 2 },
    { ...validItem(), quantity: -1 },
    { ...validItem(), quantity: 2.9 },
  ]);
  check('computeItemCount defensive', count === 4, `count=${count} (expected 4)`);

  // 10. A line missing unitTotal gets a safe fallback (base + extras).
  const fallback = cart.sanitizeCartItems([
    { ...validItem(), id: 'z', unitTotal: undefined, basePrice: 1000, extras: [{ id: '1', price: 250 }] },
  ]);
  check('unitTotal fallback computed', fallback[0].unitTotal === 1250, `unitTotal=${fallback[0] && fallback[0].unitTotal}`);

  // 11. Corrupt persisted JSON simulates what restore must survive.
  const corrupt = '{ this is not valid json ]]';
  let parsed = null;
  try { parsed = JSON.parse(corrupt); } catch { parsed = null; }
  const fromCorrupt = cart.sanitizeCartItems(parsed && parsed.items);
  check('corrupt persisted JSON -> empty safe cart', Array.isArray(fromCorrupt) && fromCorrupt.length === 0, `len=${fromCorrupt.length}`);

  const fails = results.filter((r) => !r.pass);
  console.log('\n==========================================================');
  console.log(`CART PERSISTENCE TOTAL: ${results.length}  PASS: ${results.length - fails.length}  FAIL: ${fails.length}`);
  fails.forEach((f) => console.log(`  FAIL -> ${f.name} :: ${f.detail}`));
  console.log('==========================================================');
  if (fails.length) process.exitCode = 1;
}

main();
