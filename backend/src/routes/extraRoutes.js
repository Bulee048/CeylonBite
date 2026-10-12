const express = require('express');
const router = express.Router();
const extraController = require('../controllers/extraController');

// Extras catalog is public (menu browsing does not require auth).
router.get('/', extraController.getExtras);

module.exports = router;
