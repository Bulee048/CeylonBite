require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 CeylonBite REST API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`===================================================`);
});
