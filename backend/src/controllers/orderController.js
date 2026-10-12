const { getPool, mssql } = require('../config/db');

// Extract a usable, positive integer extra id from a client-supplied extra.
// Accepts either a bare id ('3', 3) or an object carrying { id } / { extraId }.
// Returns null when the entry has no parseable id (such entries are ignored
// rather than charged).
const normalizeExtraId = (rawExtra) => {
  const candidate =
    rawExtra && typeof rawExtra === 'object'
      ? rawExtra.id ?? rawExtra.extraId
      : rawExtra;
  const parsed = parseInt(candidate, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

exports.createOrder = async (req, res, next) => {
  let transaction;
  try {
    const userId = req.user.userId;
    const {
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryInstructions,
      orderType = 'delivery',
      paymentMethod = 'cash',
      promoCode,
      items = [],
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Order must contain at least one item.',
      });
    }

    // Validate order type and payment method against DB CHECK constraints
    const validOrderTypes = ['delivery', 'pickup'];
    const validPaymentMethods = ['cash', 'card', 'wallet'];
    if (!validOrderTypes.includes(orderType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order type "${orderType}". Allowed values: ${validOrderTypes.join(', ')}`,
      });
    }
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method "${paymentMethod}". Allowed values: ${validPaymentMethods.join(', ')}`,
      });
    }

    // Delivery orders must carry a real phone number and address; all orders need a name
    if (!customerName || !customerName.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'A customer name is required for orders.',
      });
    }
    if (orderType === 'delivery') {
      if (!customerPhone || !customerPhone.toString().trim()) {
        return res.status(400).json({
          success: false,
          message: 'A contact phone number is required for delivery orders.',
        });
      }
      if (!deliveryAddress || !deliveryAddress.toString().trim()) {
        return res.status(400).json({
          success: false,
          message: 'A delivery address is required for delivery orders.',
        });
      }
    }

    const pool = await getPool();

    // 0. Preload the authoritative extras catalog for every extra id referenced
    //    by the order. The client's own price is never used for billing.
    const requestedExtraIds = new Set();
    for (const rawItem of items) {
      if (!rawItem || !Array.isArray(rawItem.extras)) continue;
      for (const rawExtra of rawItem.extras) {
        const extraId = normalizeExtraId(rawExtra);
        if (extraId !== null) requestedExtraIds.add(extraId);
      }
    }

    const extrasById = new Map();
    if (requestedExtraIds.size > 0) {
      const extraIds = [...requestedExtraIds];
      const extrasReq = pool.request();
      extraIds.forEach((id, i) => extrasReq.input(`extra${i}`, mssql.Int, id));
      const extrasRes = await extrasReq.query(`
        SELECT ExtraID, Name, Price, IsAvailable
        FROM Extras
        WHERE ExtraID IN (${extraIds.map((_, i) => `@extra${i}`).join(', ')})
      `);
      for (const row of extrasRes.recordset) {
        extrasById.set(Number(row.ExtraID), row);
      }
    }

    // 1. Authoritative Backend Price Calculation from DB
    let calculatedSubtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const foodIdInt = parseInt(item.foodId || item.foodItem?.id || item.id, 10);
      if (isNaN(foodIdInt)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid food item in order cart.',
        });
      }

      const foodRes = await pool
        .request()
        .input('foodId', mssql.Int, foodIdInt)
        .query('SELECT Name, Price, IsAvailable FROM Foods WHERE FoodID = @foodId');

      if (foodRes.recordset.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Food item #${foodIdInt} no longer exists.`,
        });
      }

      const foodRow = foodRes.recordset[0];
      if (!foodRow.IsAvailable) {
        return res.status(400).json({
          success: false,
          message: `"${foodRow.Name}" is currently unavailable for ordering.`,
        });
      }

      const unitBasePrice = Number(foodRow.Price);
      const foodName = foodRow.Name;
      const rawQty = parseInt(item.quantity, 10);
      if (!item.quantity || Number.isNaN(rawQty) || rawQty < 1) {
        return res.status(400).json({
          success: false,
          message: `Quantity for "${foodName}" must be a positive integer.`,
        });
      }
      const qty = rawQty;

      // Resolve extras against the authoritative catalog. Unknown/unavailable
      // ids are rejected; entries without an id are ignored; repeated ids are
      // counted once. The client-supplied `price` is never read.
      const resolvedExtras = [];
      const seenExtraIds = new Set();
      if (Array.isArray(item.extras)) {
        for (const rawExtra of item.extras) {
          const extraId = normalizeExtraId(rawExtra);
          if (extraId === null) continue; // ignore malformed entries
          if (seenExtraIds.has(extraId)) continue; // ignore duplicates
          seenExtraIds.add(extraId);

          const catalogExtra = extrasById.get(extraId);
          if (!catalogExtra) {
            return res.status(400).json({
              success: false,
              message: `Add-on #${extraId} is not a valid option for "${foodName}".`,
            });
          }
          if (!catalogExtra.IsAvailable) {
            return res.status(400).json({
              success: false,
              message: `Add-on "${catalogExtra.Name}" is currently unavailable. Please remove it and try again.`,
            });
          }
          resolvedExtras.push({
            id: String(extraId),
            name: catalogExtra.Name,
            price: Number(catalogExtra.Price),
          });
        }
      }

      const extrasSum = resolvedExtras.reduce((sum, e) => sum + e.price, 0);

      const validSpices = ['Mild', 'Ceylon Spicy', 'Extra Hot'];
      const selectedSpice = validSpices.includes(item.selectedSpice)
        ? item.selectedSpice
        : 'Ceylon Spicy';

      const unitTotal = unitBasePrice + extrasSum;
      const lineTotal = unitTotal * qty;

      calculatedSubtotal += lineTotal;

      processedItems.push({
        foodId: foodIdInt,
        foodName,
        quantity: qty,
        basePrice: unitBasePrice,
        selectedSpice,
        extras: JSON.stringify(resolvedExtras),
        unitTotal,
        lineTotal,
      });
    }

    // 2. Server-side Promo Code Validation
    let calculatedDiscount = 0;
    let validatedPromoCode = null;

    if (promoCode && promoCode.trim()) {
      const promoRes = await pool
        .request()
        .input('code', mssql.NVarChar, promoCode.trim().toLowerCase())
        .query(`
          SELECT Code, DiscountType, DiscountValue, MinOrderAmount, ExpiresAt, IsActive, UsageLimit, UsedCount
          FROM PromoCodes
          WHERE LOWER(Code) = LOWER(@code) AND IsActive = 1
        `);

      if (promoRes.recordset.length > 0) {
        const promo = promoRes.recordset[0];
        const notExpired = !promo.ExpiresAt || new Date(promo.ExpiresAt) >= new Date();
        const underLimit = !promo.UsageLimit || promo.UsedCount < promo.UsageLimit;
        const meetsMin = calculatedSubtotal >= Number(promo.MinOrderAmount);

        if (notExpired && underLimit && meetsMin) {
          validatedPromoCode = promo.Code;
          if (promo.DiscountType === 'percent') {
            calculatedDiscount = (calculatedSubtotal * Number(promo.DiscountValue)) / 100;
          } else {
            calculatedDiscount = Number(promo.DiscountValue);
          }
          calculatedDiscount = Math.min(calculatedSubtotal, Math.round(calculatedDiscount));
        }
      }
    }

    const deliveryFee = orderType === 'delivery' ? 350.00 : 0.00;
    const grandTotal = Math.max(0, calculatedSubtotal + deliveryFee - calculatedDiscount);

    const orderNumber = `CB${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Execute SQL Transaction
    transaction = new mssql.Transaction(pool);
    await transaction.begin();

    const orderRequest = new mssql.Request(transaction);
    const orderResult = await orderRequest
      .input('orderNumber', mssql.NVarChar, orderNumber)
      .input('userID', mssql.Int, userId)
      .input('customerName', mssql.NVarChar, customerName)
      .input('customerPhone', mssql.NVarChar, customerPhone || null)
      .input('orderType', mssql.NVarChar, orderType)
      .input('status', mssql.NVarChar, 'pending')
      .input('paymentMethod', mssql.NVarChar, paymentMethod)
      .input('subtotal', mssql.Decimal(10, 2), calculatedSubtotal)
      .input('deliveryFee', mssql.Decimal(10, 2), deliveryFee)
      .input('discount', mssql.Decimal(10, 2), calculatedDiscount)
      .input('promoCode', mssql.NVarChar, validatedPromoCode)
      .input('total', mssql.Decimal(10, 2), grandTotal)
      .input('deliveryAddress', mssql.NVarChar, deliveryAddress || null)
      .input('deliveryInstructions', mssql.NVarChar, deliveryInstructions || '')
      .query(`
        INSERT INTO Orders (OrderNumber, UserID, CustomerName, CustomerPhone, OrderType, Status, PaymentMethod, Subtotal, DeliveryFee, Discount, PromoCode, Total, DeliveryAddress, DeliveryInstructions)
        OUTPUT INSERTED.OrderID AS id, INSERTED.OrderNumber AS orderNumber
        VALUES (@orderNumber, @userID, @customerName, @customerPhone, @orderType, @status, @paymentMethod, @subtotal, @deliveryFee, @discount, @promoCode, @total, @deliveryAddress, @deliveryInstructions);
      `);

    const createdOrder = orderResult.recordset[0];

    for (const item of processedItems) {
      const itemRequest = new mssql.Request(transaction);
      await itemRequest
        .input('orderID', mssql.Int, createdOrder.id)
        .input('foodID', mssql.Int, item.foodId)
        .input('foodName', mssql.NVarChar, item.foodName)
        .input('quantity', mssql.Int, item.quantity)
        .input('basePrice', mssql.Decimal(10, 2), item.basePrice)
        .input('selectedSpice', mssql.NVarChar, item.selectedSpice)
        .input('extras', mssql.NVarChar, item.extras)
        .input('unitTotal', mssql.Decimal(10, 2), item.unitTotal)
        .input('lineTotal', mssql.Decimal(10, 2), item.lineTotal)
        .query(`
          INSERT INTO OrderItems (OrderID, FoodID, FoodName, Quantity, BasePrice, SelectedSpice, Extras, UnitTotal, LineTotal)
          VALUES (@orderID, @foodID, @foodName, @quantity, @basePrice, @selectedSpice, @extras, @unitTotal, @lineTotal);
        `);
    }

    if (validatedPromoCode) {
      const promoRequest = new mssql.Request(transaction);
      await promoRequest
        .input('code', mssql.NVarChar, validatedPromoCode)
        .query('UPDATE PromoCodes SET UsedCount = UsedCount + 1 WHERE Code = @code');
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        // Server-authoritative breakdown so the client displays the real total.
        subtotal: calculatedSubtotal,
        deliveryFee,
        discount: calculatedDiscount,
        promoCode: validatedPromoCode,
        total: grandTotal,
      },
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const pool = await getPool();

    const ordersRes = await pool
      .request()
      .input('userId', mssql.Int, userId)
      .query(`
        SELECT OrderID AS id, OrderNumber AS order_number, CustomerName AS customer_name,
               OrderType AS order_type, Status AS status, PaymentMethod AS payment_method,
               Subtotal AS subtotal, DeliveryFee AS delivery_fee, Discount AS discount,
               Total AS total, DeliveryAddress AS delivery_address, CreatedAt AS created_at
        FROM Orders
        WHERE UserID = @userId
        ORDER BY CreatedAt DESC
      `);

    const orders = ordersRes.recordset;

    for (const ord of orders) {
      const itemsRes = await pool
        .request()
        .input('orderId', mssql.Int, ord.id)
        .query(`
          SELECT FoodID AS food_id, FoodName AS food_name, Quantity AS quantity,
                 UnitTotal AS unit_total, SelectedSpice AS selected_spice
          FROM OrderItems
          WHERE OrderID = @orderId
        `);
      ord.items = itemsRes.recordset;
    }

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const orderRes = await pool
      .request()
      .input('id', mssql.NVarChar, id)
      .query(`
        SELECT OrderID AS id, UserID AS user_id, OrderNumber AS order_number, CustomerName AS customer_name,
               OrderType AS order_type, Status AS status, PaymentMethod AS payment_method,
               Subtotal AS subtotal, DeliveryFee AS delivery_fee, Discount AS discount,
               Total AS total, DeliveryAddress AS delivery_address, CreatedAt AS created_at
        FROM Orders
        WHERE OrderID = TRY_CAST(@id AS INT) OR OrderNumber = @id
      `);

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const ord = orderRes.recordset[0];

    // Authorization: customers may only read their OWN orders (admins may read any).
    // Return 404 (not 403) so we do not leak the existence of other users' orders.
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin && Number(ord.user_id) !== Number(req.user.userId)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    delete ord.user_id;

    const itemsRes = await pool
      .request()
      .input('orderId', mssql.Int, ord.id)
      .query(`
        SELECT FoodID AS food_id, FoodName AS food_name, Quantity AS quantity,
               UnitTotal AS unit_total, SelectedSpice AS selected_spice
        FROM OrderItems
        WHERE OrderID = @orderId
      `);
    ord.items = itemsRes.recordset;

    res.json({
      success: true,
      data: ord,
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN ORDER MANAGEMENT
exports.getAllOrdersAdmin = async (req, res, next) => {
  try {
    const pool = await getPool();
    const ordersRes = await pool
      .request()
      .query(`
        SELECT OrderID AS id, OrderNumber AS order_number, CustomerName AS customer_name,
               OrderType AS order_type, Status AS status, PaymentMethod AS payment_method,
               Subtotal AS subtotal, DeliveryFee AS delivery_fee, Discount AS discount,
               Total AS total, DeliveryAddress AS delivery_address, CreatedAt AS created_at
        FROM Orders
        ORDER BY CreatedAt DESC
      `);

    const orders = ordersRes.recordset;

    for (const ord of orders) {
      const itemsRes = await pool
        .request()
        .input('orderId', mssql.Int, ord.id)
        .query(`
          SELECT FoodID AS food_id, FoodName AS food_name, Quantity AS quantity,
                 UnitTotal AS unit_total, SelectedSpice AS selected_spice
          FROM OrderItems
          WHERE OrderID = @orderId
        `);
      ord.items = itemsRes.recordset;
    }

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatusAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed values: ${allowedStatuses.join(', ')}`,
      });
    }

    const pool = await getPool();

    // Resolve the current order first (by numeric id or order number) so we can
    // (a) reject updates to non-existent orders and (b) validate the transition.
    const currentRes = await pool
      .request()
      .input('id', mssql.NVarChar, id)
      .query(`
        SELECT OrderID AS id, Status AS status
        FROM Orders
        WHERE OrderID = TRY_CAST(@id AS INT) OR OrderNumber = @id
      `);

    if (currentRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = currentRes.recordset[0];
    const currentStatus = order.status;

    // Enforce the documented order lifecycle: forward-only, plus cancel from any
    // non-terminal state. Setting the same status is treated as idempotent.
    const allowedTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };
    const validNext = allowedTransitions[currentStatus] || [];
    const isNoOp = status === currentStatus;

    if (!isNoOp && !validNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order status from "${currentStatus}" to "${status}".`,
      });
    }

    await pool
      .request()
      .input('orderId', mssql.Int, order.id)
      .input('status', mssql.NVarChar, status)
      .query(`
        UPDATE Orders
        SET Status = @status, UpdatedAt = GETDATE()
        WHERE OrderID = @orderId
      `);

    res.json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
