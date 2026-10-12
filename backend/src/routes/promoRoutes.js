const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/validate', promoController.validatePromo);

module.exports = router;