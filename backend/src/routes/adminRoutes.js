const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const orderController = require('../controllers/orderController');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Protect all admin routes
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Admin Food CRUD
router.post('/foods', adminController.createFood);
router.put('/foods/:id', adminController.updateFood);
router.delete('/foods/:id', adminController.deleteFood);
router.patch('/foods/:id/availability', adminController.toggleAvailability);

// Admin Orders
router.get('/orders', orderController.getAllOrdersAdmin);
router.patch('/orders/:id/status', orderController.updateOrderStatusAdmin);

// Admin Customers
router.get('/customers', userController.getCustomers);

// Admin Stats
router.get('/dashboard', userController.getDashboardStats);
router.get('/analytics', userController.getAnalyticsStats);

module.exports = router;
