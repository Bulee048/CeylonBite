const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', orderController.createOrder);
router.get('/my', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);

module.exports = router;
