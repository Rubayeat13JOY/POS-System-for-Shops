const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

const memberValidation = [
  body('card_number')
    .trim()
    .notEmpty().withMessage('Card number is required'),

  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

  body('phone')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 }).withMessage('Phone number looks too short'),
];

router.get('/', verifyToken, isAdmin, memberController.getAllMembers);
router.get('/:card_number', verifyToken, memberController.getMemberByCard);
router.post('/', verifyToken, memberValidation, memberController.createMember);
router.put('/:id', verifyToken, isAdmin, memberValidation, memberController.updateMember);
router.patch('/:id/deactivate', verifyToken, isAdmin, memberController.deactivateMember);
router.patch('/:id/reactivate', verifyToken, isAdmin, memberController.reactivateMember);

module.exports = router;