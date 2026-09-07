const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'ceylonbite_super_secret_jwt_key_2026';
  return jwt.sign({ userId, role }, secret, { expiresIn: '7d' });
};

module.exports = generateToken;
