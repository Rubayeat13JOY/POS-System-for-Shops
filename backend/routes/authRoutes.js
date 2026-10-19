const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Validation rules for register
const registerValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('role')
    .optional()
    .isIn(['admin', 'cashier']).withMessage('Role must be admin or cashier')
];

// Validation rules for login
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required')
];

// Auth routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// User management routes (admin only)
router.get('/users', verifyToken, isAdmin, authController.getAllUsers);
router.patch('/users/:id/deactivate', verifyToken, isAdmin, authController.deactivateUser);
router.patch('/users/:id/reactivate', verifyToken, isAdmin, authController.reactivateUser);

module.exports = router;