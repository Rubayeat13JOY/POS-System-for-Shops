const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { verifyToken } = require('../middleware/authMiddleware');

// Sales routes
router.post('/', verifyToken, salesController.createSale);
router.get('/', verifyToken, salesController.getAllSales);
router.get('/:id', verifyToken, salesController.getInvoice);

module.exports = router;