const mssql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'CeylonBiteAppUser',
  password: process.env.DB_PASSWORD || 'CeylonBiteAppSecurePass2026!',
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_DATABASE || 'CeylonBiteDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise = null;

const getPool = async () => {
  if (!poolPromise) {
    poolPromise = new mssql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        console.log('✅ Connected to SQL Server (CeylonBiteDB)');
        return pool;
      })
      .catch((err) => {
        console.warn('⚠️ SQL Server Connection Error:', err.message);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
};

module.exports = {
  mssql,
  getPool,
};
