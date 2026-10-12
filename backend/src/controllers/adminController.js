const { getPool, mssql } = require('../config/db');

exports.createFood = async (req, res, next) => {
  try {
    const { name, description, price, image_url, category_id, rating, is_available, is_popular } = req.body;

    if (!name || price === undefined || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Name and a valid price (> 0) are required.',
      });
    }

    const pool = await getPool();

    // Resolve category ID if slug passed
    let categoryIDInt = parseInt(category_id, 10);
    if (isNaN(categoryIDInt)) {
      const catRes = await pool
        .request()
        .input('slug', mssql.NVarChar, category_id || 'burgers')
        .query('SELECT CategoryID FROM Categories WHERE Slug = @slug OR Name = @slug');

      categoryIDInt = catRes.recordset.length > 0 ? catRes.recordset[0].CategoryID : 1;
    }

    const result = await pool
      .request()
      .input('categoryID', mssql.Int, categoryIDInt)
      .input('name', mssql.NVarChar, name.trim())
      .input('description', mssql.NVarChar, description || '')
      .input('price', mssql.Decimal(10, 2), price)
      .input('imageURL', mssql.NVarChar, image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800')
      .input('rating', mssql.Decimal(2, 1), rating || 4.5)
      .input('isAvailable', mssql.Bit, is_available !== undefined ? (is_available ? 1 : 0) : 1)
      .input('isPopular', mssql.Bit, is_popular ? 1 : 0)
      .query(`
        INSERT INTO Foods (CategoryID, Name, Description, Price, ImageURL, Rating, IsAvailable, IsPopular)
        OUTPUT INSERTED.FoodID AS id, INSERTED.Name AS name, INSERTED.Description AS description,
               INSERTED.Price AS price, INSERTED.ImageURL AS image_url, INSERTED.IsAvailable AS is_available,
               INSERTED.IsPopular AS is_popular
        VALUES (@categoryID, @name, @description, @price, @imageURL, @rating, @isAvailable, @isPopular);
      `);

    res.status(201).json({
      success: true,
      message: 'Food item created successfully',
      data: result.recordset[0],
    });
  } catch (error) {
    next(error);
  }
};

exports.updateFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, image_url, category_id, rating, is_available, is_popular } = req.body;

    const pool = await getPool();

    // Resolve category ID if slug passed (matches createFood behavior)
    let categoryIDInt = null;
    if (category_id) {
      categoryIDInt = parseInt(category_id, 10);
      if (isNaN(categoryIDInt)) {
        const catRes = await pool
          .request()
          .input('slug', mssql.NVarChar, category_id)
          .query('SELECT CategoryID FROM Categories WHERE Slug = @slug OR Name = @slug');

        if (catRes.recordset.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Provided category does not exist.',
          });
        }
        categoryIDInt = catRes.recordset[0].CategoryID;
      }
    }

    const result = await pool
      .request()
      .input('id', mssql.Int, id)
      .input('categoryID', mssql.Int, categoryIDInt)
      .input('name', mssql.NVarChar, name)
      .input('description', mssql.NVarChar, description)
      .input('price', mssql.Decimal(10, 2), price)
      .input('imageURL', mssql.NVarChar, image_url)
      .input('rating', mssql.Decimal(2, 1), rating)
      // Passing NULL when the field is omitted lets COALESCE keep the existing
      // value instead of silently flipping availability/popularity flags.
      .input('isAvailable', mssql.Bit, is_available === undefined || is_available === null ? null : (is_available ? 1 : 0))
      .input('isPopular', mssql.Bit, is_popular === undefined || is_popular === null ? null : (is_popular ? 1 : 0))
      .query(`
        UPDATE Foods
        SET CategoryID = COALESCE(@categoryID, CategoryID),
            Name = COALESCE(@name, Name),
            Description = COALESCE(@description, Description),
            Price = COALESCE(@price, Price),
            ImageURL = COALESCE(@imageURL, ImageURL),
            Rating = COALESCE(@rating, Rating),
            IsAvailable = COALESCE(@isAvailable, IsAvailable),
            IsPopular = COALESCE(@isPopular, IsPopular),
            UpdatedAt = GETDATE()
        WHERE FoodID = @id;
      `);

    if (!result.rowsAffected || result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    res.json({
      success: true,
      message: 'Food item updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    try {
      await pool
        .request()
        .input('id', mssql.Int, id)
        .query('DELETE FROM Foods WHERE FoodID = @id');
    } catch (dbErr) {
      // If referenced by OrderItems or FK constraint, soft delete by disabling availability
      await pool
        .request()
        .input('id', mssql.Int, id)
        .query('UPDATE Foods SET IsAvailable = 0, UpdatedAt = GETDATE() WHERE FoodID = @id');
    }

    res.json({
      success: true,
      message: 'Food item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    const pool = await getPool();

    await pool
      .request()
      .input('id', mssql.Int, id)
      .input('isAvailable', mssql.Bit, is_available ? 1 : 0)
      .query('UPDATE Foods SET IsAvailable = @isAvailable, UpdatedAt = GETDATE() WHERE FoodID = @id');

    res.json({
      success: true,
      message: 'Availability updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
