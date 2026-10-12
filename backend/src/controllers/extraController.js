const { getPool, mssql } = require('../config/db');

// Public catalog of available add-ons. Prices here are the authoritative ones
// used when an order is created.
exports.getExtras = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ExtraID AS id, Name AS name, Price AS price
      FROM Extras
      WHERE IsAvailable = 1
      ORDER BY SortOrder ASC, ExtraID ASC
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    next(error);
  }
};
