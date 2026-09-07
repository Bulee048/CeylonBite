const { getPool, mssql } = require('../config/db');

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
      items = [],
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Order must contain at least one item.',
      });
    }

    const pool = await getPool();

    // 1. Authoritative Backend Price Calculation
    let calculatedSubtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const foodIdInt = parseInt(item.foodItem?.id || item.id, 10);
      let unitBasePrice = 1490.00;
      let foodName = item.foodItem?.name || item.name || 'CeylonBite Meal';

      if (!isNaN(foodIdInt)) {
        const foodRes = await pool
          .request()
          .input('foodId', mssql.Int, foodIdInt)
          .query('SELECT Name, Price FROM Foods WHERE FoodID = @foodId');

        if (foodRes.recordset.length > 0) {
          unitBasePrice = Number(foodRes.recordset[0].Price);
          foodName = foodRes.recordset[0].Name;
        }
      }

      const qty = item.quantity || 1;
      const unitTotal = unitBasePrice;
      const lineTotal = unitTotal * qty;

      calculatedSubtotal += lineTotal;

      processedItems.push({
        foodId: isNaN(foodIdInt) ? null : foodIdInt,
        foodName,
        quantity: qty,
        basePrice: unitBasePrice,
        selectedSpice: item.selectedSpice || 'Ceylon Spicy',
        extras: JSON.stringify(item.extras || []),
        unitTotal,
        lineTotal,
      });
    }

    const deliveryFee = orderType === 'delivery' ? 350.00 : 0.00;
    const discount = 0.00;
    const grandTotal = calculatedSubtotal + deliveryFee - discount;

    const orderNumber = `CB${Math.floor(100000 + Math.random() * 900000)}`;

    // 2. Execute SQL Transaction
    transaction = new mssql.Transaction(pool);
    await transaction.begin();

    const orderRequest = new mssql.Request(transaction);
    const orderResult = await orderRequest
      .input('orderNumber', mssql.NVarChar, orderNumber)
      .input('userID', mssql.Int, userId)
      .input('customerName', mssql.NVarChar, customerName || 'Valued Diner')
      .input('customerPhone', mssql.NVarChar, customerPhone || '+94 77 123 4567')
      .input('orderType', mssql.NVarChar, orderType)
      .input('status', mssql.NVarChar, 'confirmed')
      .input('paymentMethod', mssql.NVarChar, paymentMethod)
      .input('subtotal', mssql.Decimal(10, 2), calculatedSubtotal)
      .input('deliveryFee', mssql.Decimal(10, 2), deliveryFee)
      .input('discount', mssql.Decimal(10, 2), discount)
      .input('total', mssql.Decimal(10, 2), grandTotal)
      .input('deliveryAddress', mssql.NVarChar, deliveryAddress || 'Colombo, Sri Lanka')
      .input('deliveryInstructions', mssql.NVarChar, deliveryInstructions || '')
      .query(`
        INSERT INTO Orders (OrderNumber, UserID, CustomerName, CustomerPhone, OrderType, Status, PaymentMethod, Subtotal, DeliveryFee, Discount, Total, DeliveryAddress, DeliveryInstructions)
        OUTPUT INSERTED.OrderID AS id, INSERTED.OrderNumber AS orderNumber
        VALUES (@orderNumber, @userID, @customerName, @customerPhone, @orderType, @status, @paymentMethod, @subtotal, @deliveryFee, @discount, @total, @deliveryAddress, @deliveryInstructions);
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

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
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
        SELECT OrderID AS id, OrderNumber AS order_number, CustomerName AS customer_name,
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
    await pool
      .request()
      .input('id', mssql.NVarChar, id)
      .input('status', mssql.NVarChar, status)
      .query(`
        UPDATE Orders
        SET Status = @status, UpdatedAt = GETDATE()
        WHERE OrderID = TRY_CAST(@id AS INT) OR OrderNumber = @id
      `);

    res.json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
