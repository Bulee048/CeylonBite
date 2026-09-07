const bcrypt = require('bcryptjs');
const { getPool, mssql } = require('../config/db');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const pool = await getPool();

    // Check if user already exists
    const checkUser = await pool
      .request()
      .input('email', mssql.NVarChar, email.toLowerCase().trim())
      .query('SELECT UserID FROM Users WHERE LOWER(Email) = LOWER(@email)');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert new user - ALWAYS role = 'customer'
    const insertResult = await pool
      .request()
      .input('fullName', mssql.NVarChar, fullName.trim())
      .input('email', mssql.NVarChar, email.toLowerCase().trim())
      .input('phone', mssql.NVarChar, phone || null)
      .input('passwordHash', mssql.NVarChar, passwordHash)
      .input('role', mssql.NVarChar, 'customer')
      .query(`
        INSERT INTO Users (FullName, Email, Phone, PasswordHash, Role)
        OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.Email, INSERTED.Phone, INSERTED.Role
        VALUES (@fullName, @email, @phone, @passwordHash, @role);
      `);

    const newUser = insertResult.recordset[0];
    const token = generateToken(newUser.UserID, newUser.Role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: newUser.UserID,
          fullName: newUser.FullName,
          email: newUser.Email,
          phone: newUser.Phone,
          role: newUser.Role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const pool = await getPool();

    // Query user
    const result = await pool
      .request()
      .input('email', mssql.NVarChar, email.toLowerCase().trim())
      .query('SELECT UserID, FullName, Email, Phone, PasswordHash, Role, IsActive FROM Users WHERE LOWER(Email) = LOWER(@email)');

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const user = result.recordset[0];

    if (!user.IsActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated.',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const token = generateToken(user.UserID, user.Role);

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user.UserID,
          fullName: user.FullName,
          email: user.Email,
          phone: user.Phone,
          role: user.Role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input('userId', mssql.Int, req.user.userId)
      .query('SELECT UserID, FullName, Email, Phone, Role FROM Users WHERE UserID = @userId');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    const user = result.recordset[0];

    res.json({
      success: true,
      data: {
        id: user.UserID,
        fullName: user.FullName,
        email: user.Email,
        phone: user.Phone,
        role: user.Role,
      },
    });
  } catch (error) {
    next(error);
  }
};
