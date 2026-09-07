const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Configure CORS for local Expo Web & Mobile development
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CeylonBite API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route '${req.originalUrl}' not found.`,
  });
});

// Centralized Error Middleware
app.use(errorMiddleware);

module.exports = app;
