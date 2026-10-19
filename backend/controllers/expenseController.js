const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');

// GET ALL EXPENSES
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      order: [['expense_date', 'DESC']]
    });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get expenses', error: error.message });
  }
};

// ADD EXPENSE
exports.addExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, amount, expense_date } = req.body;

    const expense = await Expense.create({
      description,
      amount,
      expense_date: expense_date || new Date()
    });

    res.status(201).json({ message: 'Expense recorded successfully', expense });

  } catch (error) {
    res.status(500).json({ message: 'Failed to record expense', error: error.message });
  }
};

// UPDATE EXPENSE
exports.updateExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { description, amount, expense_date } = req.body;

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.update({ description, amount, expense_date });
    res.status(200).json({ message: 'Expense updated successfully', expense });

  } catch (error) {
    res.status(500).json({ message: 'Failed to update expense', error: error.message });
  }
};

// DELETE EXPENSE
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.destroy();
    res.status(200).json({ message: 'Expense deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Failed to delete expense', error: error.message });
  }
};