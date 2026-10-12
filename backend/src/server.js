require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🍔 CeylonBite Fullstack App is Ready!`);
  console.log(`🌐 Frontend (Web App):   http://localhost:8081`);
  console.log(`⚙️  Backend REST API:     http://localhost:${PORT}/api`);
  console.log(`📡 Health Check:         http://localhost:${PORT}/api/health`);
  console.log(`===================================================`);
});
