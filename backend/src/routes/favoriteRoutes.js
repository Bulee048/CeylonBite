const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', favoriteController.getFavorites);
router.post('/:foodId', favoriteController.addFavorite);
router.delete('/:foodId', favoriteController.removeFavorite);

module.exports = router;
