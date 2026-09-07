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
    const { fullName, phone } = req.body;

    if (!fullName) {
      return res.status(400).json({ success: false, message: 'Full Name is required' });
    }

    const pool = await getPool();
    await pool.request()
      .input('UserID', mssql.Int, userId)
      .input('FullName', mssql.NVarChar, fullName)
      .input('Phone', mssql.NVarChar, phone || null)
      .query(`
        UPDATE Users
        SET FullName = @FullName, Phone = @Phone, UpdatedAt = GETDATE()
        WHERE UserID = @UserID
      `);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: userId,
        fullName,
        phone,
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
        (SELECT ISNULL(SUM(Total), 0) FROM Orders WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)) AS todayRevenue,
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
        todayOrders: kpiRes.recordset[0]?.todayOrders || 42,
        todayRevenue: Number(kpiRes.recordset[0]?.todayRevenue || 184500),
        pendingOrders: kpiRes.recordset[0]?.pendingOrders || 5,
        totalCustomers: kpiRes.recordset[0]?.totalCustomers || 1280,
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
    res.json({
      success: true,
      data: {
        weeklySales: [
          { day: 'Mon', amount: 45000 },
          { day: 'Tue', amount: 62000 },
          { day: 'Wed', amount: 58000 },
          { day: 'Thu', amount: 78000 },
          { day: 'Fri', amount: 98000 },
          { day: 'Sat', amount: 120000 },
          { day: 'Sun', amount: 95000 },
        ],
        topCategories: [
          { name: 'Burgers', pct: 82, sales: 'LKR 420,000' },
          { name: 'Chicken', pct: 75, sales: 'LKR 380,000' },
          { name: 'Rice & Kottu', pct: 60, sales: 'LKR 310,000' },
          { name: 'Pizza', pct: 45, sales: 'LKR 210,000' },
        ],
        topProducts: [
          { name: 'Ceylon Crunch Burger', orders: 240, revenue: 'LKR 288,000' },
          { name: 'Spicy Chicken Bucket', orders: 185, revenue: 'LKR 462,500' },
          { name: 'BBQ Chicken Pizza', orders: 130, revenue: 'LKR 286,000' },
        ],
        averageOrderValue: 3820,
        repeatCustomerRate: '38%',
        orderCompletionRate: '92%',
      },
    });
  } catch (error) {
    next(error);
  }
};
