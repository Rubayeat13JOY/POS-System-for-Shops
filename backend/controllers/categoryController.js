const { validationResult } = require('express-validator');
const Category = require('../models/Category');

// GET ALL CATEGORIES
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get categories', error: error.message });
  }
};

// CREATE A NEW CATEGORY
exports.addCategory = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { category_name } = req.body;
  
      const existing = await Category.findOne({ where: { category_name } });
      if (existing) {
        return res.status(400).json({ message: 'Category already exists' });
      }
  
      const category = await Category.create({ category_name });
      res.status(201).json({ message: 'Category created successfully', category });
  
    } catch (error) {
      res.status(500).json({ message: 'Failed to create category', error: error.message });
    }
  };
  // UPDATE CATEGORY
  exports.updateCategory = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { id } = req.params;
      const { category_name } = req.body;
  
      const [updatedCount] = await Category.update(
        { category_name },
        { where: { id } }
      );
  
      if (updatedCount === 0) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      res.status(200).json({ message: 'Category updated successfully' });
  
    } catch (error) {
      res.status(500).json({ message: 'Failed to update category', error: error.message });
    }
  };
  // DELETE CATEGORY
  exports.deleteCategory = async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      await category.destroy();
      res.status(200).json({ message: 'Category deleted successfully' });

    } catch (error) {
      res.status(500).json({ message: 'Failed to delete category', error: error.message });
    }
  };




