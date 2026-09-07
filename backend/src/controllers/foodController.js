const { getPool, mssql } = require('../config/db');

exports.getCategories = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query('SELECT CategoryID AS id, Name AS name, Slug AS slug, IconName AS icon_name, ImageURL AS image_url FROM Categories WHERE IsActive = 1 ORDER BY SortOrder ASC');

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFoods = async (req, res, next) => {
  try {
    const { search, category, popular, available } = req.query;
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT f.FoodID AS id, f.Name AS name, f.Description AS description, f.Price AS price,
             f.ImageURL AS image_url, c.Slug AS category_slug, f.Rating AS rating,
             f.IsAvailable AS is_available, f.IsPopular AS is_popular
      FROM Foods f
      LEFT JOIN Categories c ON f.CategoryID = c.CategoryID
      WHERE 1=1
    `;

    if (search) {
      request.input('search', mssql.NVarChar, `%${search.trim()}%`);
      query += ` AND (f.Name LIKE @search OR f.Description LIKE @search)`;
    }

    if (category && category !== 'all') {
      request.input('category', mssql.NVarChar, category);
      query += ` AND (c.Slug = @category OR CAST(f.CategoryID AS NVARCHAR) = @category)`;
    }

    if (popular === 'true') {
      query += ` AND f.IsPopular = 1`;
    }

    if (available === 'true') {
      query += ` AND f.IsAvailable = 1`;
    }

    query += ` ORDER BY f.CreatedAt DESC`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFoodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool
      .request()
      .input('id', mssql.Int, id)
      .query(`
        SELECT f.FoodID AS id, f.Name AS name, f.Description AS description, f.Price AS price,
               f.ImageURL AS image_url, c.Slug AS category_slug, f.Rating AS rating,
               f.IsAvailable AS is_available, f.IsPopular AS is_popular
        FROM Foods f
        LEFT JOIN Categories c ON f.CategoryID = c.CategoryID
        WHERE f.FoodID = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found',
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    next(error);
  }
};
