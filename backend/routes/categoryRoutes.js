const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Validation rules
const categoryValidation = [
  body('category_name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2 }).withMessage('Category name must be at least 2 characters')
];

// Category routes (all protected - must be logged in)
router.get('/', verifyToken, categoryController.getAllCategories);
router.post('/', verifyToken, isAdmin, categoryValidation, categoryController.addCategory);
router.put('/:id', verifyToken, isAdmin, categoryValidation, categoryController.updateCategory);
router.delete('/:id', verifyToken, isAdmin, categoryController.deleteCategory);

module.exports = router;