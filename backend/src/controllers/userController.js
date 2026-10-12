const { getPool, mssql } = require('../config/db');

exports.getCustomers = async (req, res, next) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT u.UserID AS id, u.FullName AS fullName, u.Email AS email, u.Phone AS phone,
             u.IsActive AS isActive,
             COUNT(o.OrderID) AS orderCount,
             ISNULL(SUM(o.Total), 0) AS totalSpent
      FROM Users u
      LEFT JOIN Orders o ON u.UserID = o.UserID
      WHERE u.Role = 'customer'
      GROUP BY u.UserID, u.FullName, u.Email, u.Phone, u.IsActive
      ORDER BY u.UserID DESC
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { fullName, phone, address } = req.body;

    if (!fullName) {
      return res.status(400).json({ success: false, message: 'Full Name is required' });
    }

    const pool = await getPool();
    await pool.request()
      .input('UserID', mssql.Int, userId)
      .input('FullName', mssql.NVarChar, fullName)
      .input('Phone', mssql.NVarChar, phone || null)
      .input('Address', mssql.NVarChar, address || null)
      .query(`
        UPDATE Users
        SET FullName = @FullName, Phone = @Phone, Address = @Address, UpdatedAt = GETDATE()
        WHERE UserID = @UserID
      `);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: userId,
        fullName,
        phone,
        address,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const pool = await getPool();

    // 1. KPI Summaries
    const kpiRes = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Orders WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)) AS todayOrders,
        (SELECT ISNULL(SUM(Total), 0) FROM Orders WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE) AND Status != 'cancelled') AS todayRevenue,
        (SELECT COUNT(*) FROM Orders WHERE Status IN ('pending', 'confirmed', 'preparing')) AS pendingOrders,
        (SELECT COUNT(*) FROM Users WHERE Role = 'customer') AS totalCustomers
    `);

    // 2. Recent Orders
    const recentOrdersRes = await pool.request().query(`
      SELECT TOP 5 OrderID AS id, OrderNumber AS order_number, CustomerName AS customer_name,
             Total AS total, Status AS status, CreatedAt AS created_at
      FROM Orders
      ORDER BY CreatedAt DESC
    `);

    // 3. Popular Foods
    const popularRes = await pool.request().query(`
      SELECT TOP 4 f.FoodID AS id, f.Name AS name, f.Price AS price, c.Name AS category_name,
             COUNT(oi.OrderItemID) AS sales_count
      FROM Foods f
      LEFT JOIN OrderItems oi ON f.FoodID = oi.FoodID
      LEFT JOIN Categories c ON f.CategoryID = c.CategoryID
      GROUP BY f.FoodID, f.Name, f.Price, c.Name
      ORDER BY sales_count DESC
    `);

    res.json({
      success: true,
      data: {
        todayOrders: kpiRes.recordset[0]?.todayOrders || 0,
        todayRevenue: Number(kpiRes.recordset[0]?.todayRevenue || 0),
        pendingOrders: kpiRes.recordset[0]?.pendingOrders || 0,
        totalCustomers: kpiRes.recordset[0]?.totalCustomers || 0,
        recentOrders: recentOrdersRes.recordset,
        popularItems: popularRes.recordset,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnalyticsStats = async (req, res, next) => {
  try {
    const pool = await getPool();

    // 1. AOV and total completed
    const statsRes = await pool.request().query(`
      SELECT
        ISNULL(AVG(Total), 0) AS avgOrderValue,
        COUNT(*) AS totalOrders,
        (SELECT COUNT(*) FROM Orders WHERE Status = 'delivered') AS completedOrders,
        (SELECT COUNT(DISTINCT UserID) FROM Orders) AS uniqueOrderingCustomers,
        (SELECT COUNT(*) FROM (SELECT UserID FROM Orders WHERE Status != 'cancelled' GROUP BY UserID HAVING COUNT(*) > 1) AS repeats) AS repeatCustomers
      FROM Orders
      WHERE Status != 'cancelled'
    `);

    // 2. Top Products by Revenue
    const topProductsRes = await pool.request().query(`
      SELECT TOP 5 f.Name AS name, COUNT(oi.OrderItemID) AS orders, ISNULL(SUM(oi.LineTotal), 0) AS revenue
      FROM OrderItems oi
      JOIN Foods f ON oi.FoodID = f.FoodID
      GROUP BY f.Name
      ORDER BY revenue DESC
    `);

    // 3. Top Categories
    const topCategoriesRes = await pool.request().query(`
      SELECT TOP 4 c.Name AS name, ISNULL(SUM(oi.LineTotal), 0) AS sales
      FROM OrderItems oi
      JOIN Foods f ON oi.FoodID = f.FoodID
      JOIN Categories c ON f.CategoryID = c.CategoryID
      GROUP BY c.Name
      ORDER BY sales DESC
    `);

    // Total category revenue (non-cancelled orders) for real revenue-share percentages
    const totalCatSalesRes = await pool.request().query(`
      SELECT ISNULL(SUM(oi.LineTotal), 0) AS total
      FROM OrderItems oi
      JOIN Orders o ON oi.OrderID = o.OrderID
      WHERE o.Status != 'cancelled'
    `);
    const totalCategorySales = Number(totalCatSalesRes.recordset[0]?.total || 0);

    // 4. Weekly Sales - last 7 days with Sri Lanka Time (UTC+5:30)
    // Uses TODATETIMEOFFSET or DATEADD to group by Sri Lanka local calendar date
    const weeklySalesRes = await pool.request().query(`
      WITH SL_Orders AS (
        SELECT
          Total,
          CAST(DATEADD(minute, 330, CreatedAt) AS DATE) AS LocalDate,
          DATENAME(dw, DATEADD(minute, 330, CreatedAt)) AS DayName
        FROM Orders
        WHERE Status != 'cancelled'
          AND DATEADD(minute, 330, CreatedAt) >= CAST(DATEADD(day, -6, DATEADD(minute, 330, GETUTCDATE())) AS DATE)
      )
      SELECT
        LocalDate,
        DayName,
        SUM(Total) AS amount
      FROM SL_Orders
      GROUP BY LocalDate, DayName
      ORDER BY LocalDate ASC
    `);

    const dayMap = { Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };
    const salesByDay = {};
    let totalWeeklyAmount = 0;

    for (const row of weeklySalesRes.recordset) {
      const short = dayMap[row.DayName] || row.DayName.substring(0, 3);
      salesByDay[short] = (salesByDay[short] || 0) + Number(row.amount);
      totalWeeklyAmount += Number(row.amount);
    }

    const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxAmount = Math.max(...orderedDays.map((day) => salesByDay[day] || 0), 1);

    const weeklySales = orderedDays.map((day) => {
      const val = salesByDay[day] || 0;
      return {
        day,
        rawAmount: val,
        amount: val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`,
        heightPct: Math.round((val / maxAmount) * 100),
      };
    });

    const stats = statsRes.recordset[0] || {};
    const totalOrdersCount = stats.totalOrders || 0;
    const completedCount = stats.completedOrders || 0;
    const completionPct = totalOrdersCount > 0 ? Math.round((completedCount / totalOrdersCount) * 100) : 100;
    const orderingCustomers = stats.uniqueOrderingCustomers || 0;
    const repeatCustomers = stats.repeatCustomers || 0;
    const repeatRatePct = orderingCustomers > 0 ? Math.round((repeatCustomers / orderingCustomers) * 100) : 0;

    res.json({
      success: true,
      data: {
        weeklySales,
        totalWeeklyAmount,
        topCategories: topCategoriesRes.recordset.map((cat) => {
          const catSales = Number(cat.sales || 0);
          const catPct = totalCategorySales > 0 ? Math.round((catSales / totalCategorySales) * 100) : 0;
          return {
            name: cat.name,
            pct: catPct,
            sales: `LKR ${catSales.toLocaleString()}`,
          };
        }),
        topProducts: topProductsRes.recordset.map((p) => ({
          name: p.name,
          orders: p.orders,
          revenue: `LKR ${Number(p.revenue).toLocaleString()}`,
        })),
        averageOrderValue: Math.round(Number(stats.avgOrderValue || 0)),
        repeatCustomerRate: `${repeatRatePct}%`,
        orderCompletionRate: `${completionPct}%`,
      },
    });
  } catch (error) {
    next(error);
  }
};
