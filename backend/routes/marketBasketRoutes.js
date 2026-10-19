const express = require('express');
const router = express.Router();
const marketBasketController = require('../controllers/marketBasketController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/analyze', verifyToken, isAdmin, marketBasketController.analyzeMarketBasket);

module.exports = router;