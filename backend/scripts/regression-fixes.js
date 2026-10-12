/* eslint-disable */
// CeylonBite — FOCUSED REGRESSION TESTS for the QA fixes.
//
// These run against a live backend + SQL Server and specifically exercise the
// defects that the broad live-audit.js does NOT cover:
//   R1  IDOR: a customer must NOT be able to read another customer's order.
//   R2  Price tampering: negative/NaN extras must not reduce the order total.
//   R3  Order status workflow: invalid transitions are rejected; unknown orders 404.
//   R4  Admin partial update preserves IsAvailable / IsPopular when omitted.
//   R5  Admin update of a non-existent food returns 404.
//
// Usage:  AUDIT_BASE=http://localhost:5002/api node scripts/regression-fixes.js
// Created accounts match qafix%@ceylonbite.lk and can be removed with
// scripts/cleanup-test-data.js.
const mssql = require('mssql');

const BASE = process.env.AUDIT_BASE || 'http://localhost:5001/api';
const DB_CFG = {
  user: 'CeylonBiteAppUser',
  password: 'CeylonBiteAppSecurePass2026!',
  server: '127.0.0.1',
  port: 1433,
  database: 'CeylonBiteDB',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 4, min: 1 },
};

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} :: ${detail}`);
};

let sql;
async function sqlQuery(query, params = {}) {
  const req = sql.request();
  for (const [k, v] of Object.entries(params)) req.input(k, v);
  return (await req.query(query)).recordset;
}

async function api(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    return { status: 0, data: null, error: e.message };
  }
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data, ok: res.ok };
}

async function registerUser(prefix, ts, password) {
  const email = `${prefix}${ts}@ceylonbite.lk`;
  const r = await api('POST', '/auth/register', {
    body: { fullName: `QA Fix ${prefix}`, email, password, phone: '0771234567', address: 'QA Address' },
  });
  return { email, password, status: r.status, token: r.data?.data?.token, id: r.data?.data?.user?.id };
}

async function main() {
  sql = await mssql.connect(DB_CFG);
  const ts = Date.now();
  const pass = 'QaFixPass123!';
  const createdFoodIds = [];
  const createdUserIds = [];

  // ---- setup accounts ----
  const custA = await registerUser('qafixA', ts, pass);
  const custB = await registerUser('qafixB', ts, pass);
  const admin = await registerUser('qafixAdmin', ts, pass);
  [custA, custB, admin].forEach((u) => u.id && createdUserIds.push(u.id));
  await sqlQuery("UPDATE Users SET Role = 'admin' WHERE UserID = @id", { id: admin.id });
  const adminLogin = await api('POST', '/auth/login', { body: { email: admin.email, password: pass } });
  const adminToken = adminLogin.data?.data?.token;
  check('setup-accounts', custA.status === 201 && custB.status === 201 && adminToken, `A=${custA.id} B=${custB.id} admin=${admin.id}`);

  // ---- pick an available food ----
  const foodsRes = await api('GET', '/foods');
  const food = (foodsRes.data?.data || []).find((f) => f.is_available !== false && f.is_available !== 0);
  check('setup-food', !!food, `food #${food?.id} ${food?.name}`);
  const foodId = food.id;
  const dbPrice = Number((await sqlQuery('SELECT Price FROM Foods WHERE FoodID = @id', { id: foodId }))[0].Price);

  // ---- R1: IDOR ----
  const orderA = await api('POST', '/orders', {
    token: custA.token,
    body: { customerName: 'QA A', orderType: 'pickup', paymentMethod: 'cash', items: [{ foodId, quantity: 1 }] },
  });
  const orderAId = orderA.data?.data?.id;
  check('R1-order-created', orderA.status === 201 && !!orderAId, `order ${orderAId} created for A`);

  const aOwn = await api('GET', `/orders/${orderAId}`, { token: custA.token });
  check('R1-owner-can-read', aOwn.status === 200 && aOwn.data?.data?.id === orderAId, `A -> ${aOwn.status}`);

  const bReadsA = await api('GET', `/orders/${orderAId}`, { token: custB.token });
  check('R1-IDOR-blocked', bReadsA.status === 404, `B reading A's order -> ${bReadsA.status} (404 expected)`);

  const adminReads = await api('GET', `/orders/${orderAId}`, { token: adminToken });
  check('R1-admin-can-read', adminReads.status === 200, `admin -> ${adminReads.status}`);

  // ---- R2: negative extras cannot lower the total ----
  const tamper = await api('POST', '/orders', {
    token: custA.token,
    body: {
      customerName: 'QA A',
      orderType: 'pickup',
      paymentMethod: 'cash',
      items: [{ foodId, quantity: 1, extras: [{ name: 'Hack', price: -100000 }, { name: 'NaN', price: 'abc' }] }],
    },
  });
  const tamperId = tamper.data?.data?.id;
  const tamperTotal = Number(tamper.data?.data?.total);
  check('R2-negative-extras-201', tamper.status === 201, `order -> ${tamper.status}`);
  check('R2-total-not-lowered', Math.abs(tamperTotal - dbPrice) < 0.01, `total=${tamperTotal} dbPrice=${dbPrice} (negative extras ignored)`);

  // ---- R3: status workflow ----
  const badTransition = await api('PATCH', `/admin/orders/${orderAId}/status`, { token: adminToken, body: { status: 'delivered' } });
  check('R3-invalid-transition-400', badTransition.status === 400, `pending -> delivered -> ${badTransition.status} (400 expected)`);

  const goodTransition = await api('PATCH', `/admin/orders/${orderAId}/status`, { token: adminToken, body: { status: 'confirmed' } });
  check('R3-valid-transition-200', goodTransition.status === 200, `pending -> confirmed -> ${goodTransition.status}`);

  const skip = await api('PATCH', `/admin/orders/${orderAId}/status`, { token: adminToken, body: { status: 'delivered' } });
  check('R3-skip-step-400', skip.status === 400, `confirmed -> delivered -> ${skip.status} (400 expected)`);

  const missing = await api('PATCH', '/admin/orders/99999999/status', { token: adminToken, body: { status: 'confirmed' } });
  check('R3-missing-order-404', missing.status === 404, `nonexistent order -> ${missing.status} (404 expected)`);

  const unsupported = await api('PATCH', `/admin/orders/${orderAId}/status`, { token: adminToken, body: { status: 'on_the_way' } });
  check('R3-unsupported-status-400', unsupported.status === 400, `unsupported status -> ${unsupported.status} (400 expected)`);

  // ---- R4: partial update preserves flags ----
  const createRes = await api('POST', '/admin/foods', {
    token: adminToken,
    body: { name: `QA Fix Temp ${ts}`, price: 1000, category_id: 'burgers', is_available: false, is_popular: true },
  });
  const tempId = createRes.data?.data?.id;
  if (tempId) createdFoodIds.push(tempId);
  check('R4-food-created', createRes.status === 201 && !!tempId, `food ${tempId}`);
  await sqlQuery('UPDATE Foods SET IsAvailable = 0, IsPopular = 1 WHERE FoodID = @id', { id: tempId });

  const partial = await api('PUT', `/admin/foods/${tempId}`, { token: adminToken, body: { price: 1234.5 } });
  const after = (await sqlQuery('SELECT IsAvailable, IsPopular, Price FROM Foods WHERE FoodID = @id', { id: tempId }))[0];
  check('R4-partial-update-200', partial.status === 200, `partial update -> ${partial.status}`);
  check('R4-flags-preserved',
    after && after.IsAvailable === false && after.IsPopular === true && Number(after.Price) === 1234.5,
    `after: available=${after?.IsAvailable} popular=${after?.IsPopular} price=${after?.Price}`);

  // ---- R5: update non-existent food -> 404 ----
  const missingFood = await api('PUT', '/admin/foods/99999999', { token: adminToken, body: { name: 'ghost' } });
  check('R5-missing-food-update-404', missingFood.status === 404, `update nonexistent food -> ${missingFood.status} (404 expected)`);

  // ========================================================================
  // Production-readiness pass: server-authoritative extras & pricing.
  // ========================================================================

  // ---- R6: extras catalog is served from the DB ----
  const extrasCatalogRes = await api('GET', '/extras');
  const extrasCatalog = extrasCatalogRes.data?.data || [];
  const cheese = extrasCatalog.find((e) => e.name === 'Extra Cheese');
  check(
    'R6-extras-catalog',
    extrasCatalogRes.status === 200 && extrasCatalog.length >= 1 && !!cheese && Number(cheese.price) > 0,
    `extras=${extrasCatalog.map((e) => `${e.id}:${e.name}:${e.price}`).join('|')}`
  );
  const cheesePrice = Number(cheese?.price || 0);

  // ---- R7: client-supplied extra price is ignored (DB price wins) ----
  const fakePriceOrder = await api('POST', '/orders', {
    token: custA.token,
    body: {
      customerName: 'QA A',
      orderType: 'pickup',
      paymentMethod: 'cash',
      items: [
        {
          foodId,
          quantity: 1,
          selectedSpice: 'Mild',
          extras: [{ id: cheese.id, name: 'Extra Cheese', price: 999999 }],
        },
      ],
    },
  });
  const fpId = fakePriceOrder.data?.data?.id;
  const fpTotal = Number(fakePriceOrder.data?.data?.total);
  check(
    'R7-fake-extra-price-ignored',
    fakePriceOrder.status === 201 && Math.abs(fpTotal - (dbPrice + cheesePrice)) < 0.01,
    `total=${fpTotal} expected=${dbPrice + cheesePrice} (client 999999 ignored)`
  );

  // ---- R7b: negative fake extra price with a valid id is ignored ----
  const negPriceOrder = await api('POST', '/orders', {
    token: custA.token,
    body: {
      customerName: 'QA A',
      orderType: 'pickup',
      paymentMethod: 'cash',
      items: [{ foodId, quantity: 1, extras: [{ id: cheese.id, price: -5000 }] }],
    },
  });
  const negTotal = Number(negPriceOrder.data?.data?.total);
  check(
    'R7b-negative-extra-price-ignored',
    negPriceOrder.status === 201 && Math.abs(negTotal - (dbPrice + cheesePrice)) < 0.01,
    `total=${negTotal} expected=${dbPrice + cheesePrice}`
  );

  // ---- R8: unknown extra id -> 400 (never persisted) ----
  const unknownExtra = await api('POST', '/orders', {
    token: custA.token,
    body: {
      customerName: 'QA A',
      orderType: 'pickup',
      paymentMethod: 'cash',
      items: [{ foodId, quantity: 1, extras: [{ id: 999999 }] }],
    },
  });
  check('R8-unknown-extra-rejected', unknownExtra.status === 400, `unknown extra -> ${unknownExtra.status} (400 expected)`);

  // ---- R9: duplicate extra ids are counted once ----
  const dupExtra = await api('POST', '/orders', {
    token: custA.token,
    body: {
      customerName: 'QA A',
      orderType: 'pickup',
      paymentMethod: 'cash',
      items: [{ foodId, quantity: 1, extras: [{ id: cheese.id }, { id: cheese.id }] }],
    },
  });
  const dupTotal = Number(dupExtra.data?.data?.total);
  check(
    'R9-duplicate-extra-counted-once',
    dupExtra.status === 201 && Math.abs(dupTotal - (dbPrice + cheesePrice)) < 0.01,
    `total=${dupTotal} expected=${dbPrice + cheesePrice}`
  );

  // ---- R10: unavailable extra -> 400 ----
  const tempExtraName = `QA Unavailable ${ts}`;
  await sqlQuery('INSERT INTO Extras (Name, Price, IsAvailable, SortOrder) VALUES (@n, 100, 0, 99)', { n: tempExtraName });
  const tempExtra = (await sqlQuery('SELECT ExtraID FROM Extras WHERE Name = @n', { n: tempExtraName }))[0];
  const unavailableExtra = await api('POST', '/orders', {
    token: custA.token,
    body: {
      customerName: 'QA A',
      orderType: 'pickup',
      paymentMethod: 'cash',
      items: [{ foodId, quantity: 1, extras: [{ id: tempExtra.ExtraID }] }],
    },
  });
  check('R10-unavailable-extra-rejected', unavailableExtra.status === 400, `unavailable extra -> ${unavailableExtra.status} (400 expected)`);
  await sqlQuery('DELETE FROM Extras WHERE ExtraID = @id', { id: tempExtra.ExtraID });

  // ---- R13: client-supplied base price is ignored ----
  const baseTamper = await api('POST', '/orders', {
    token: custA.token,
    body: {
      customerName: 'QA A',
      orderType: 'pickup',
      paymentMethod: 'cash',
      items: [{ foodId, quantity: 2, price: 1, basePrice: 1, unitTotal: 1 }],
    },
  });
  const btTotal = Number(baseTamper.data?.data?.total);
  check(
    'R13-base-price-tamper-ignored',
    baseTamper.status === 201 && Math.abs(btTotal - dbPrice * 2) < 0.01,
    `total=${btTotal} expected=${dbPrice * 2}`
  );

  // ---- R11: persisted order reconciles with the DB (authoritative) ----
  const orderRow = (await sqlQuery('SELECT Subtotal, DeliveryFee, Discount, Total FROM Orders WHERE OrderID = @id', { id: fpId }))[0];
  const lineSum = (await sqlQuery('SELECT SUM(UnitTotal * Quantity) AS s FROM OrderItems WHERE OrderID = @id', { id: fpId }))[0];
  check(
    'R11-db-reconciles',
    !!orderRow &&
      Math.abs(Number(orderRow.Total) - fpTotal) < 0.01 &&
      Math.abs(Number(orderRow.Subtotal) - Number(lineSum.s)) < 0.01 &&
      Math.abs(Number(orderRow.Subtotal) - (dbPrice + cheesePrice)) < 0.01,
    `db total=${orderRow?.Total} subtotal=${orderRow?.Subtotal} lineSum=${lineSum?.s}`
  );

  // ---- R12: promo discount is recalculated server-side; client figures ignored ----
  const promoOrder = await api('POST', '/orders', {
    token: custA.token,
    body: {
      customerName: 'QA A',
      orderType: 'delivery',
      paymentMethod: 'cash',
      deliveryAddress: 'QA Address',
      customerPhone: '0771234567',
      promoCode: 'CEYLON20',
      items: [{ foodId, quantity: 2, extras: [{ id: cheese.id }] }],
      // Deliberately bogus client-side billing figures that must be ignored.
      subtotal: 1,
      deliveryFee: 0,
      discount: 999999,
      total: 1,
    },
  });
  const promoSubtotal = (dbPrice + cheesePrice) * 2;
  const expectedDiscount = Math.round(promoSubtotal * 0.2);
  const expectedTotal = promoSubtotal + 350 - expectedDiscount;
  check(
    'R12-promo-server-authoritative',
    promoOrder.status === 201 &&
      Math.abs(Number(promoOrder.data?.data?.discount) - expectedDiscount) < 0.01 &&
      Math.abs(Number(promoOrder.data?.data?.total) - expectedTotal) < 0.01,
    `discount=${promoOrder.data?.data?.discount} (exp ${expectedDiscount}) total=${promoOrder.data?.data?.total} (exp ${expectedTotal})`
  );

  // ---- cleanup ----
  if (tempId) {
    await api('DELETE', `/admin/foods/${tempId}`, { token: adminToken });
  }
  if (createdUserIds.length) {
    const req = sql.request();
    createdUserIds.forEach((id, i) => req.input(`u${i}`, id));
    await req.query(`DELETE FROM Users WHERE UserID IN (${createdUserIds.map((_, i) => `@u${i}`).join(', ')})`);
  }

  const fails = results.filter((r) => !r.pass);
  console.log('\n==========================================================');
  console.log(`REGRESSION TOTAL: ${results.length}  PASS: ${results.length - fails.length}  FAIL: ${fails.length}`);
  fails.forEach((f) => console.log(`  FAIL -> ${f.name} :: ${f.detail}`));
  console.log('==========================================================');

  await sql.close();
  if (fails.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error('REGRESSION CRASH:', e);
  try { sql && sql.close(); } catch {}
  process.exitCode = 1;
});
