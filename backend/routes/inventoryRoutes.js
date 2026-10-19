const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Inventory routes
router.get('/', verifyToken, inventoryController.getInventory);
router.post('/stock-in', verifyToken, isAdmin, inventoryController.stockIn);

module.exports = router;