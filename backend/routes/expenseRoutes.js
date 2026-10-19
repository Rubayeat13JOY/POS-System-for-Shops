const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Validation rules
const expenseValidation = [
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required'),

  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0 }).withMessage('Amount must be a positive number')
];

// Expense routes (admin only - financial data)
router.get('/', verifyToken, isAdmin, expenseController.getAllExpenses);
router.post('/', verifyToken, isAdmin, expenseValidation, expenseController.addExpense);
router.put('/:id', verifyToken, isAdmin, expenseValidation, expenseController.updateExpense);
router.delete('/:id', verifyToken, isAdmin, expenseController.deleteExpense);

module.exports = router;