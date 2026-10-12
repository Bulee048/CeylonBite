const { getPool, mssql } = require('../config/db');

exports.validatePromo = async (req, res, next) => {
  try {
    const { code, subtotal = 0 } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Promo code is required.',
      });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('code', mssql.NVarChar, code.trim().toLowerCase())
      .query(`
        SELECT PromoID, Code, DiscountType, DiscountValue, MinOrderAmount, ExpiresAt, IsActive, UsageLimit, UsedCount
        FROM PromoCodes
        WHERE LOWER(Code) = LOWER(@code) AND IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid or inactive promo code "${code}".`,
      });
    }

    const promo = result.recordset[0];

    if (promo.ExpiresAt && new Date(promo.ExpiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This promo code has expired.',
      });
    }

    if (promo.UsageLimit && promo.UsedCount >= promo.UsageLimit) {
      return res.status(400).json({
        success: false,
        message: 'This promo code usage limit has been reached.',
      });
    }

    if (Number(subtotal) < Number(promo.MinOrderAmount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order subtotal of LKR ${promo.MinOrderAmount} is required for this code.`,
      });
    }

    let discountAmount = 0;
    if (promo.DiscountType === 'percent') {
      discountAmount = (Number(subtotal) * Number(promo.DiscountValue)) / 100;
    } else {
      discountAmount = Number(promo.DiscountValue);
    }
    discountAmount = Math.min(Number(subtotal), Math.round(discountAmount));

    res.json({
      success: true,
      data: {
        promoCode: promo.Code,
        discountType: promo.DiscountType,
        discountValue: Number(promo.DiscountValue),
        discountAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};
