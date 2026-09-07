const { getPool, mssql } = require('../config/db');

exports.getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const pool = await getPool();

    const result = await pool
      .request()
      .input('userId', mssql.Int, userId)
      .query('SELECT FavoriteID AS id, FoodID AS food_id FROM Favorites WHERE UserID = @userId');

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    next(error);
  }
};

exports.addFavorite = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { foodId } = req.params;

    const foodIdInt = parseInt(foodId, 10);
    if (isNaN(foodIdInt)) {
      return res.status(400).json({ success: false, message: 'Invalid Food ID' });
    }

    const pool = await getPool();

    // Check duplicate
    const check = await pool
      .request()
      .input('userId', mssql.Int, userId)
      .input('foodId', mssql.Int, foodIdInt)
      .query('SELECT FavoriteID FROM Favorites WHERE UserID = @userId AND FoodID = @foodId');

    if (check.recordset.length === 0) {
      await pool
        .request()
        .input('userId', mssql.Int, userId)
        .input('foodId', mssql.Int, foodIdInt)
        .query('INSERT INTO Favorites (UserID, FoodID) VALUES (@userId, @foodId)');
    }

    res.status(201).json({
      success: true,
      message: 'Added to favorites',
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFavorite = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { foodId } = req.params;

    const foodIdInt = parseInt(foodId, 10);
    if (isNaN(foodIdInt)) {
      return res.status(400).json({ success: false, message: 'Invalid Food ID' });
    }

    const pool = await getPool();

    await pool
      .request()
      .input('userId', mssql.Int, userId)
      .input('foodId', mssql.Int, foodIdInt)
      .query('DELETE FROM Favorites WHERE UserID = @userId AND FoodID = @foodId');

    res.json({
      success: true,
      message: 'Removed from favorites',
    });
  } catch (error) {
    next(error);
  }
};
