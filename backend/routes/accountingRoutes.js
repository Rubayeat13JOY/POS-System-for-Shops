const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Accounting routes (admin only - financial data)
router.get('/summary', verifyToken, isAdmin, accountingController.getFinancialSummary);
router.get('/category-sales', verifyToken, isAdmin, accountingController.getCategoryWiseSales);
router.get('/daily-summary', verifyToken, isAdmin, accountingController.getDailySummary);
router.get('/sales-report', verifyToken, isAdmin, accountingController.getSalesReport);
router.get('/period-detail', verifyToken, isAdmin, accountingController.getPeriodDetail);
module.exports = router;