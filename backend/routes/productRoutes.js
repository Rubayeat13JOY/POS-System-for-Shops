const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const upload = require('../config/upload');

// Validation rules
const productValidation = [
    body('product_name')
      .trim()
      .notEmpty().withMessage('Product name is required')
      .isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),
  
    body('category_id')
      .notEmpty().withMessage('Category is required')
      .isInt().withMessage('Category ID must be a number'),
  
    body('purchase_price')
      .notEmpty().withMessage('Purchase price is required')
      .isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
  
    body('selling_price')
      .notEmpty().withMessage('Selling price is required')
      .isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  ];
  
  // Product routes
  router.get('/', verifyToken, productController.getAllProducts);
  router.get('/:id', verifyToken, productController.getProduct);
  router.post('/', verifyToken, isAdmin, upload.single('image'), productValidation, productController.addProduct);
  router.put('/:id', verifyToken, isAdmin, upload.single('image'), productValidation, productController.updateProduct);
  router.delete('/:id', verifyToken, isAdmin, productController.deleteProduct);
  
  module.exports = router;
