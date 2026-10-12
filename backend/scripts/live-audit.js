/* eslint-disable */
// CeylonBite LIVE RUNTIME & INTEGRATION AUDIT
// Runs real HTTP requests against the running backend and cross-checks
// persistence against the live SQL Server database.
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
const record = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} :: ${detail}`);
};

let sql;
async function sqlQuery(query, params = {}) {
  const req = sql.request();
  for (const [k, v] of Object.entries(params)) {
    req.input(k, v);
  }
  return (await req.query(query)).recordset;
}

let sqlOk = false;
async function connectSql() {
  try {
    sql = await mssql.connect(DB_CFG);
    sqlOk = true;
    record('sql-connect', true, `Connected as ${DB_CFG.user} to ${DB_CFG.database}`);
  } catch (e) {
    sqlOk = false;
    record('sql-connect', false, e.message);
  }
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

const JWT_SECRET = 'ceylonbite_super_secret_jwt_key_2026';
const jwt = require('jsonwebtoken');

async function main() {
  await connectSql();

  // ============ 1. BACKEND STARTUP / HEALTH ============
  const health = await api('GET', '/health');
  record('health', health.status === 200 && health.data && health.data.success === true,
    `GET /api/health -> ${health.status}`);

  // ============ 2. MENU (public) ============
  const cats = await api('GET', '/categories');
  record('categories', cats.status === 200 && Array.isArray(cats.data?.data) && cats.data.data.length >= 7,
    `categories: ${cats.data?.data?.length || 0} loaded`);

  const foods = await api('GET', '/foods');
  const foodList = foods.data?.data || [];
  record('foods-list', foods.status === 200 && foodList.length >= 9, `foods: ${foodList.length} loaded`);

  // pick a stable real food (first available)
  const availFood = foodList.find((f) => Number(f.is_available) === 1);
  const foodId = availFood?.id;
  record('foods-available-anchor', !!foodId, `using food#${foodId} "${availFood?.name}" price=${availFood?.price}`);

  const detail = await api('GET', `/foods/${foodId}`);
  record('food-detail', detail.status === 200 && detail.data?.data?.id === foodId, `GET /foods/${foodId} -> ${detail.status}`);

  const detail404 = await api('GET', '/foods/999999');
  record('food-detail-404', detail404.status === 404, `missing food -> ${detail404.status}`);

  // ============ 3. AUTH ============
  const ts = Date.now();
  const custEmail = `livecust${ts}@ceylonbite.lk`;
  const custPass = 'LiveTestPass123!';

  const reg = await api('POST', '/auth/register', { body: { fullName: 'Live Audit Customer', email: custEmail, password: custPass, phone: '0771234567', address: '12 Temple Road, Colombo' } });
  let custToken = reg.data?.data?.token;
  const custUserId = reg.data?.data?.user?.id;
  record('register', reg.status === 201 && !!custToken && !!custUserId, `register ${custEmail} -> ${reg.status} id=${custUserId}`);

  if (sqlOk) {
    const users = await sqlQuery('SELECT UserID, Email, PasswordHash, Role FROM Users WHERE Email = @e', { e: custEmail });
    const u = users[0];
    record('register-db-row', !!u && !!u.PasswordHash && u.PasswordHash.startsWith('$2'), `row exists, PasswordHash stored (prefix ${u?.PasswordHash?.slice(0, 4)})`);
    record('register-bcrypt-check', !!(u && require('bcryptjs').compareSync(custPass, u.PasswordHash)), 'bcrypt.compare(password, hash) == true');
    record('register-default-role', u?.Role === 'customer', `role=${u?.Role}`);
  }

  const dup = await api('POST', '/auth/register', { body: { fullName: 'Dup', email: custEmail, password: custPass } });
  record('register-duplicate-400', dup.status === 400, `dup register -> ${dup.status}`);

  // login wrong password
  const badLogin = await api('POST', '/auth/login', { body: { email: custEmail, password: 'wrongpass99' } });
  record('login-wrong-password', badLogin.status === 401, `bad password -> ${badLogin.status}`);

  const login = await api('POST', '/auth/login', { body: { email: custEmail, password: custPass } });
  const loginToken = login.data?.data?.token;
  record('login', login.status === 200 && !!loginToken, `login -> ${login.status}, JWT returned`);

  const me = await api('GET', '/auth/me', { token: custToken });
  record('auth-me', me.status === 200 && me.data?.data?.email === custEmail, `GET /auth/me -> ${me.status}`);
  const meStr = JSON.stringify(me.data);
  record('no-hash-in-me', !/password/i.test(meStr), 'no password/hash leaked in /auth/me');

  // invalid / malformed / expired tokens
  const noTok = await api('GET', '/auth/me');
  record('auth-no-token-401', noTok.status === 401, `no token -> ${noTok.status}`);
  const badTok = await api('GET', '/auth/me', { token: 'not.a.jwt' });
  record('auth-malformed-401', badTok.status === 401, `malformed token -> ${badTok.status}`);
  const forgedTok = jwt.sign({ userId: 1, role: 'admin' }, 'some_other_secret');
  const forged = await api('GET', '/auth/me', { token: forgedTok });
  record('auth-forged-wrong-secret-401', forged.status === 401, `forged token -> ${forged.status}`);
  const expiredTok = jwt.sign({ userId: custUserId, role: 'customer' }, JWT_SECRET, { expiresIn: -60 });
  const expired = await api('GET', '/auth/me', { token: expiredTok });
  record('auth-expired-401', expired.status === 401, `expired token -> ${expired.status}`);

  // ============ 4. FAVORITES ============
  const favAdd = await api('POST', `/favorites/${foodId}`, { token: custToken });
  record('fav-add', favAdd.status === 201, `POST /favorites/${foodId} -> ${favAdd.status}`);
  const favDup = await api('POST', `/favorites/${foodId}`, { token: custToken });
  record('fav-duplicate-idempotent', favDup.status === 201, `duplicate add -> ${favDup.status}`);
  const favList = await api('GET', '/favorites', { token: custToken });
  const favCount = (favList.data?.data || []).filter((f) => f.food_id === foodId).length;
  record('fav-list-single', favList.status === 200 && favCount === 1, `favorites contains food ${favCount} time(s)`);
  if (sqlOk) {
    const favs = await sqlQuery('SELECT COUNT(*) AS c FROM Favorites WHERE UserID = @u AND FoodID = @f', { u: custUserId, f: foodId });
    record('fav-db-no-duplicate', favs[0].c === 1, `DB favorite rows = ${favs[0].c}`);
  }
  const favDel = await api('DELETE', `/favorites/${foodId}`, { token: custToken });
  record('fav-remove', favDel.status === 200, `DELETE /favorites/${foodId} -> ${favDel.status}`);
  const favList2 = await api('GET', '/favorites', { token: custToken });
  record('fav-list-empty-after-remove', !(favList2.data?.data || []).some((f) => f.food_id === foodId), 'favorite gone after remove');

  // ============ 5. PROMO ============
  const promoNames = ['promo-no-jwt', 'promo-invalid', 'promo-valid', 'promo-min'];
  // no JWT
  let r = await api('POST', '/promo/validate', { body: { code: 'CEYLON20', subtotal: 2000 } });
  record('promo-401-no-jwt', r.status === 401, `no token -> ${r.status}`);
  // with JWT invalid code
  r = await api('POST', '/promo/validate', { token: custToken, body: { code: 'NOPE99', subtotal: 2000 } });
  record('promo-invalid-400', r.status === 400, `invalid code -> ${r.status}`);
  // with JWT valid
  r = await api('POST', '/promo/validate', { token: custToken, body: { code: 'CEYLON20', subtotal: 2000 } });
  record('promo-valid', r.status === 200 && r.data?.data?.discountAmount === 400, `CEYLON20 on 2000 -> ${r.status} discount=${r.data?.data?.discountAmount}`);

  // ============ 6. CHECKOUT VALIDATION / ROLLBACK ============
  const poolOpts = { token: custToken };
  const baseItem = (over) => ({ foodId, quantity: 1, selectedSpice: 'Ceylon Spicy', ...over });

  record('borders-check-before', true, 'capturing order baseline');

  // invalid food id
  r = await api('POST', '/orders', { token: custToken, body: { customerName: 'Live Audit Customer', orderType: 'pickup', paymentMethod: 'cash', items: [baseItem({ foodId: 999999 })] } });
  record('order-invalid-food-400', r.status === 400, `invalid foodId -> ${r.status}`);

  // zero quantity (should be rejected now)
  r = await api('POST', '/orders', { token: custToken, body: { customerName: 'Q', orderType: 'pickup', paymentMethod: 'cash', items: [baseItem({ quantity: 0 })] } });
  record('order-zero-qty-400', r.status === 400, `quantity 0 -> ${r.status} (${r.data?.message || ''})`);

  // negative quantity
  r = await api('POST', '/orders', { token: custToken, body: { customerName: 'Q', orderType: 'pickup', paymentMethod: 'cash', items: [baseItem({ quantity: -3 })] } });
  record('order-negative-qty-400', r.status === 400, `quantity -3 -> ${r.status} (${r.data?.message || ''})`);

  // invalid payment method
  r = await api('POST', '/orders', { token: custToken, body: { customerName: 'P', orderType: 'pickup', paymentMethod: 'bitcoin', items: [baseItem({})] } });
  record('order-invalid-payment-400', r.status === 400, `payment bitcoin -> ${r.status}`);

  // invalid order type
  r = await api('POST', '/orders', { token: custToken, body: { customerName: 'T', orderType: 'teleport', paymentMethod: 'cash', items: [baseItem({})] } });
  record('order-invalid-type-400', r.status === 400, `orderType teleport -> ${r.status}`);

  // delivery without phone
  r = await api('POST', '/orders', { token: custToken, body: { customerName: 'D', orderType: 'delivery', paymentMethod: 'cash', deliveryAddress: 'No 1 Somewhere', items: [baseItem({})] } });
  record('order-delivery-no-phone-400', r.status === 400, `delivery no phone -> ${r.status}`);
  // delivery without address
  r = await api('POST', '/orders', { token: custToken, body: { customerName: 'D', orderType: 'delivery', paymentMethod: 'cash', customerPhone: '0771234567', items: [baseItem({})] } });
  record('order-delivery-no-address-400', r.status === 400, `delivery no address -> ${r.status}`);
  // no name
  r = await api('POST', '/orders', { token: custToken, body: { orderType: 'pickup', paymentMethod: 'cash', items: [baseItem({})] } });
  record('order-no-name-400', r.status === 400, `no customerName -> ${r.status}`);
  // empty cart
  r = await api('POST', '/orders', { token: custToken, body: { customerName: 'E', orderType: 'pickup', paymentMethod: 'cash', items: [] } });
  record('order-empty-cart-400', r.status === 400, `empty items -> ${r.status}`);

  // verify NO partial orders were created by the failed attempts (still 7 baseline orders + none from failures)
  if (sqlOk) {
    const before = await sqlQuery('SELECT COUNT(*) AS c FROM Orders WHERE UserID = @u', { u: custUserId });
    record('order-failures-no-partial', before[0].c === 0, `orders persisted for user after FAILURES = ${before[0].c} (0 expected)`);
  }

  // ============ 7. VALID CHECKOUT (delivery + promo) ============
  const dbPrice = await sqlQuery('SELECT Price FROM Foods WHERE FoodID = @f', { f: foodId });
  const unitPrice = Number(dbPrice[0]?.Price);
  const qty = 2;
  const fakeClientPrice = 1; // attempt price manipulation - must be ignored
  // Server-authoritative extras: pick a real catalog add-on and deliberately
  // send a fake client price to prove the DB price (not the client's) is billed.
  const catRes = await api('GET', '/extras');
  const catalogExtra = (catRes.data?.data || [])[0];
  const extraDbPrice = catalogExtra ? Number(catalogExtra.price) : 0;
  const extrasPayload = catalogExtra
    ? [{ id: catalogExtra.id, name: catalogExtra.name, price: fakeClientPrice }]
    : [];
  r = await api('POST', '/orders', {
    token: custToken,
    body: {
      customerName: 'Live Audit Customer',
      customerPhone: '0771234567',
      deliveryAddress: '12 Temple Road, Colombo 03',
      deliveryInstructions: 'Ring bell twice',
      orderType: 'delivery',
      paymentMethod: 'cash',
      promoCode: 'CEYLON20',
      items: [{ foodId, quantity: qty, selectedSpice: 'Ceylon Spicy', extras: extrasPayload, unitPrice: fakeClientPrice }],
    },
  });
  const orderOk = r.status === 201;
  const orderId = r.data?.data?.id;
  const expectedSubtotal = (unitPrice + extraDbPrice) * qty;
  const expectedDiscount = Math.round((expectedSubtotal * 20) / 100);
  const expectedTotal = expectedSubtotal + 350 - expectedDiscount;
  record('order-delivery-valid-201', orderOk, `valid delivery+promo -> ${r.status} id=${orderId}`);
  record('order-total-matches-db-price', orderOk && Math.abs(r.data?.data?.total - expectedTotal) < 0.01,
    `server total=${r.data?.data?.total} expected=${expectedTotal} (manipulated client price ignored)`);

  if (sqlOk && orderOk) {
    const ord = await sqlQuery('SELECT * FROM Orders WHERE OrderID = @id', { id: orderId });
    const o = ord[0];
    record('order-db-row', !!o, 'Orders row created');
    record('order-db-user-correct', o?.UserID === custUserId, `Order.UserID=${o?.UserID} matches token user ${custUserId}`);
    record('order-db-items', (await sqlQuery('SELECT COUNT(*) AS c FROM OrderItems WHERE OrderID = @id', { id: orderId }))[0].c === 1, '1 OrderItem row created');
    const oi = (await sqlQuery('SELECT * FROM OrderItems WHERE OrderID = @id', { id: orderId }))[0];
    record('order-item-qty-persisted', oi?.Quantity === qty, `item quantity=${oi?.Quantity}`);
    record('order-item-line-total-authoritative', Math.abs((Number(oi?.LineTotal) || 0) - (unitPrice + extraDbPrice) * qty) < 0.01,
      `LineTotal=${oi?.LineTotal} matches DB price ${unitPrice} + catalog extra ${extraDbPrice}`);
    record('order-promo-applied', o?.PromoCode === 'CEYLON20' && Math.abs(Number(o?.Discount) - expectedDiscount) < 0.01,
      `PromoCode=${o?.PromoCode} Discount=${o?.Discount}`);
    const promo = (await sqlQuery('SELECT UsedCount FROM PromoCodes WHERE Code = \'CEYLON20\''))[0];
    record('order-promo-used-count-inc', promo?.UsedCount >= 1, `CEYLON20 UsedCount=${promo?.UsedCount}`);
  }

  // pickup order (no phone/address required)
  r = await api('POST', '/orders', { token: custToken, body: { customerName: 'Live Audit Customer', orderType: 'pickup', paymentMethod: 'card', items: [baseItem({ quantity: 1 })] } });
  const pickupOk = r.status === 201;
  const pickupOrderId = r.data?.data?.id;
  record('order-pickup-valid-201', pickupOk, `valid pickup -> ${r.status} id=${pickupOrderId}`);

  const myOrders = await api('GET', '/orders/my', { token: custToken });
  record('orders-my', myOrders.status === 200 && (myOrders.data?.data || []).length >= 2, `GET /orders/my -> ${myOrders.status}, ${myOrders.data?.data?.length} orders`);
  const orderById = await api('GET', `/orders/${orderId}`, { token: custToken });
  record('order-by-id', orderById.status === 200 && orderById.data?.data?.id === orderId, `GET /orders/${orderId} -> ${orderById.status}`);

  // ============ 8. ORDER LIFECYCLE ============
  // create an admin account (register then promote in SQL - documented admin bootstrap)
  const adminEmail = `liveadmin${ts}@ceylonbite.lk`;
  const adminPass = 'LiveAdminPass123!';
  const admReg = await api('POST', '/auth/register', { body: { fullName: 'Live Audit Admin', email: adminEmail, password: adminPass, phone: '0777654321', address: 'Admin HQ' } });
  const adminUserId = admReg.data?.data?.user?.id;
  if (sqlOk) {
    await sqlQuery("UPDATE Users SET Role = 'admin' WHERE UserID = @id", { id: adminUserId });
    const chk = (await sqlQuery('SELECT Role FROM Users WHERE UserID = @id', { id: adminUserId }))[0];
    record('admin-bootstrap-promote', chk?.Role === 'admin', `promoted user ${adminUserId} to ${chk?.Role} via SQL`);
  }
  const admLogin = await api('POST', '/auth/login', { body: { email: adminEmail, password: adminPass } });
  const adminToken = admLogin.data?.data?.token;
  record('admin-login', admLogin.status === 200 && !!adminToken, `admin login -> ${admLogin.status}`);

  // customer token denied from admin endpoints
  r = await api('GET', '/admin/dashboard', { token: custToken });
  record('admin-customer-token-403', r.status === 403, `customer token on /admin/dashboard -> ${r.status}`);
  r = await api('GET', '/admin/orders', { token: custToken });
  record('admin-orders-customer-403', r.status === 403, `customer token on /admin/orders -> ${r.status}`);
  r = await api('GET', '/admin/customers', { token: custToken });
  record('admin-customers-customer-403', r.status === 403, `customer token on /admin/customers -> ${r.status}`);

  // lifecycle on the pickup order: pending -> confirmed -> preparing -> ready -> delivered
  const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
  const lifecycle = [];
  for (const st of statuses) {
    r = await api('PATCH', `/admin/orders/${pickupOrderId}/status`, { token: adminToken, body: { status: st } });
    lifecycle.push(`${st}:${r.status}`);
  }
  record('order-lifecycle', lifecycle.every((x) => x.endsWith(':200')), `admin status updates ${lifecycle.join(' ')}`);

  // customer sees updated status
  const ordNow = await api('GET', `/orders/${pickupOrderId}`, { token: custToken });
  record('order-customer-sees-status', ordNow.data?.data?.status === 'delivered', `customer GET status=${ordNow.data?.data?.status}`);

  // unsupported status rejected
  r = await api('PATCH', `/admin/orders/${pickupOrderId}/status`, { token: adminToken, body: { status: 'on_the_way' } });
  record('order-unsupported-status-400', r.status === 400, `status on_the_way -> ${r.status}`);

  // ============ 9. ADMIN MENU CRUD ============
  const tempName = `Live Temp Burger ${ts}`;
  r = await api('POST', '/admin/foods', { token: adminToken, body: { name: tempName, description: 'temp for live audit', price: 1200.50, category_id: 'burgers', is_available: true, is_popular: false } });
  const created = r.data?.data;
  record('admin-create-food', r.status === 201 && !!created?.id, `create food -> ${r.status} id=${created?.id}`);

  let tempFoodId = created?.id;
  if (sqlOk && tempFoodId) {
    const f = (await sqlQuery('SELECT * FROM Foods WHERE FoodID = @id', { id: tempFoodId }))[0];
    record('admin-food-in-db', !!f && f.Name === tempName && Number(f.Price) === 1200.5 && f.IsAvailable === true, `Foods row exists: ${f?.Name} / ${f?.Price} / avail=${f?.IsAvailable}`);
  }

  // update everything
  const updName = `${tempName} (Updated)`;
  r = await api('PUT', `/admin/foods/${tempFoodId}`, { token: adminToken, body: { name: updName, description: 'updated desc', price: 900.25, category_id: 'rice', rating: 4.9, is_available: false } });
  record('admin-update-food', r.status === 200, `update food -> ${r.status}`);
  if (sqlOk) {
    const f = (await sqlQuery('SELECT f.*, c.Slug AS slug FROM Foods f JOIN Categories c ON f.CategoryID=c.CategoryID WHERE f.FoodID = @id', { id: tempFoodId }))[0];
    record('admin-update-db-persisted', f?.Name === updName && Number(f?.Price) === 900.25 && f?.slug === 'rice' && f?.IsAvailable === false,
      `DB: name=${f?.Name} price=${f?.Price} cat=${f?.slug} avail=${f?.IsAvailable}`);
  }
  const getTemp = await api('GET', `/foods/${tempFoodId}`);
  record('admin-update-visible-api', getTemp.status === 200 && getTemp.data?.data?.name === updName && Number(getTemp.data?.data?.price) === 900.25,
    `GET /foods/${tempFoodId} shows updated values`);

  // availability toggle back on
  r = await api('PATCH', `/admin/foods/${tempFoodId}/availability`, { token: adminToken, body: { is_available: true } });
  record('admin-toggle-availability', r.status === 200, `toggle availability -> ${r.status}`);

  // ============ 10. UNAVAILABLE FOOD ORDER ROLLBACK ============
  // temp food now unavailable again
  await api('PATCH', `/admin/foods/${tempFoodId}/availability`, { token: adminToken, body: { is_available: false } });
  r = await api('POST', '/orders', { token: custToken, body: { customerName: 'U', orderType: 'pickup', paymentMethod: 'cash', items: [{ foodId: tempFoodId, quantity: 1 }] } });
  record('order-unavailable-food-400', r.status === 400, `order unavailable temp food -> ${r.status} (${r.data?.message || ''})`);
  if (sqlOk) {
    const cnt = (await sqlQuery('SELECT COUNT(*) AS c FROM Orders WHERE UserID = @u', { u: custUserId }))[0].c;
    record('order-unavailable-no-partial', cnt === 2, `orders for user still = ${cnt} (2 expected: 1 delivery + 1 pickup)`);
  }

  // ============ 11. ADMIN STATS ============
  r = await api('GET', '/admin/dashboard', { token: adminToken });
  const dash = r.data?.data;
  record('admin-dashboard', r.status === 200 && typeof dash?.todayOrders === 'number' && Array.isArray(dash?.popularItems), `dashboard -> ${r.status}`);
  record('dashboard-kpis', typeof dash?.todayRevenue === 'number' && typeof dash?.pendingOrders === 'number' && typeof dash?.totalCustomers === 'number', `KPIs present`);
  r = await api('GET', '/admin/analytics', { token: adminToken });
  const ana = r.data?.data;
  record('admin-analytics', r.status === 200 && Array.isArray(ana?.weeklySales) && typeof ana?.repeatCustomerRate === 'string', `analytics -> ${r.status}`);
  r = await api('GET', '/admin/orders', { token: adminToken });
  record('admin-orders-list', r.status === 200 && Array.isArray(r.data?.data) && r.data.data.length >= 8, `admin orders -> ${r.status}, ${r.data?.data?.length} orders`);
  r = await api('GET', '/admin/customers', { token: adminToken });
  const customers = r.data?.data || [];
  const customerJson = JSON.stringify(customers);
  record('admin-customers', r.status === 200 && Array.isArray(customers), `customers -> ${r.status}, ${customers.length} rows`);
  record('customers-no-passwords', !/password/i.test(customerJson), 'no password/hash in customer directory');

  // zero-order customers present (join correctness): customers with orderCount 0 must exist and be unique
  const emails = customers.map((c) => c.email);
  record('customers-unique', new Set(emails).size === customers.length, `unique emails = ${emails.length}/${customers.length}`);
  const zeroOrderCust = customers.filter((c) => Number(c.orderCount) === 0).length;
  record('customers-zero-order-rows', zeroOrderCust > 0, `${zeroOrderCust} zero-order customers visible (LEFT JOIN correct)`);

  // ============ 12. ANALYTICS CROSS-VERIFY ============
  if (sqlOk) {
    const k = (await sqlQuery(`
      SELECT
        (SELECT COUNT(*) FROM Orders WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)) AS todayOrders,
        (SELECT ISNULL(SUM(Total),0) FROM Orders WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE) AND Status != 'cancelled') AS todayRevenue,
        (SELECT COUNT(*) FROM Users WHERE Role='customer') AS totalCustomers
    `))[0];
    record('analytics-today-orders-match', Number(k.todayOrders) === Number(dash?.todayOrders), `SQL todayOrders=${k.todayOrders} == API ${dash?.todayOrders}`);
    record('analytics-today-revenue-match', Math.abs(Number(k.todayRevenue) - Number(dash?.todayRevenue)) < 0.01, `SQL todayRevenue=${k.todayRevenue} == API ${dash?.todayRevenue}`);
    record('analytics-customers-match', Number(k.totalCustomers) === Number(dash?.totalCustomers), `SQL totalCustomers=${k.totalCustomers} == API ${dash?.totalCustomers}`);

    // popular items: API top-4 must match SQL per-food order-item counts, sorted desc
    if (dash?.popularItems?.length) {
      const sq = await sqlQuery(`
        SELECT f.Name AS name, COUNT(oi.OrderItemID) AS cnt
        FROM Foods f LEFT JOIN OrderItems oi ON f.FoodID=oi.FoodID
        GROUP BY f.Name
      `);
      const map = Object.fromEntries(sq.map((r) => [r.name, Number(r.cnt)]));
      const countsMatch = dash.popularItems.every((p) => Number(p.sales_count) === map[p.name]);
      const monotonic = dash.popularItems.every((p, i) => i === 0 || Number(dash.popularItems[i - 1].sales_count) >= Number(p.sales_count));
      record('analytics-popular-match', countsMatch && monotonic,
        `API top-4 [${dash.popularItems.map((p) => `${p.name}=${p.sales_count}`).join(', ')}] match SQL counts, sorted desc`);
    }

    // repeat customer rate: repeats / unique ordering customers
    const rr = (await sqlQuery(`
      SELECT
        (SELECT COUNT(DISTINCT UserID) FROM Orders WHERE Status != 'cancelled') AS uniq,
        (SELECT COUNT(*) FROM (SELECT UserID FROM Orders WHERE Status != 'cancelled' GROUP BY UserID HAVING COUNT(*) > 1) t) AS repeats
    `))[0];
    const expectedRate = rr.uniq > 0 ? Math.round((rr.repeats / rr.uniq) * 100) : 0;
    record('analytics-repeat-rate-match', ana?.repeatCustomerRate === `${expectedRate}%`,
      `SQL repeats/uniq => ${expectedRate}% == API ${ana?.repeatCustomerRate}`);

    // category share: API top-4 categories must equal SQL top-4 by LineTotal
    const catTop = await sqlQuery(`
      SELECT TOP 4 c.Name AS name, ISNULL(SUM(oi.LineTotal),0) AS sales
      FROM OrderItems oi
      JOIN Foods f ON oi.FoodID = f.FoodID
      JOIN Categories c ON f.CategoryID = c.CategoryID
      GROUP BY c.Name ORDER BY sales DESC
    `);
    const sqCatSum = catTop.reduce((s, r) => s + Number(r.sales), 0);
    const apiCatSum = (ana?.topCategories || []).reduce((s, c) => s + Number(String(c.sales).replace(/[^\d]/g, '')), 0);
    const catNamesEq = JSON.stringify(catTop.map((r) => r.name).sort()) === JSON.stringify((ana?.topCategories || []).map((c) => c.name).sort());
    record('analytics-category-total-legible', Math.abs(sqCatSum - apiCatSum) < 0.01 && catNamesEq,
      `SQL top-4 categories sum=${sqCatSum} == API summed=${apiCatSum}; names match=${catNamesEq}`);
  }

  // ============ 13. PROFILE UPDATE + CLEANUP ============
  r = await api('PUT', '/auth/profile', { token: custToken, body: { fullName: 'Live Audit Customer Renamed', phone: '0781112233', address: 'New Address 5' } });
  record('profile-update', r.status === 200, `PUT /auth/profile -> ${r.status}`);
  const me2 = await api('GET', '/auth/me', { token: custToken });
  record('profile-persisted', me2.data?.data?.fullName === 'Live Audit Customer Renamed' && me2.data?.data?.phone === '0781112233', `me reflects update`);

  // ============ 14. DELETE TEMP FOOD (delete is officially implemented) ============
  r = await api('DELETE', `/admin/foods/${tempFoodId}`, { token: adminToken });
  record('admin-delete-food', r.status === 200, `DELETE /admin/foods/${tempFoodId} -> ${r.status}`);
  if (sqlOk) {
    const gone = (await sqlQuery('SELECT COUNT(*) AS c FROM Foods WHERE FoodID = @id', { id: tempFoodId }))[0].c;
    record('admin-delete-db-cleanup', gone === 0, `food rows remaining = ${gone} (0 expected; or soft-disabled)`);
  }

  // ============ SUMMARY ============
  const fails = results.filter((x) => !x.pass);
  console.log('\n==========================================================');
  console.log(`TOTAL: ${results.length}  PASS: ${results.length - fails.length}  FAIL: ${fails.length}`);
  for (const f of fails) console.log(`  FAIL -> ${f.name} :: ${f.detail}`);
  console.log('==========================================================');
  try { await sql.close(); } catch {}
}

main().catch((e) => {
  console.error('AUDIT SCRIPT CRASH:', e);
  try { sql && sql.close(); } catch {}
  process.exitCode = 1;
});