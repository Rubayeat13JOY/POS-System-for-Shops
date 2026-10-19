const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const { Op } = require('sequelize');

// GET ALL PRODUCTS
exports.getAllProducts = async (req, res) => {
    try {
        const { search, page = 1, limit = 8, category_id } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const whereClause = {};
          if (search) whereClause.product_name = { [Op.like]: `%${search}%` };
          if (category_id) whereClause.category_id = parseInt(category_id);

    
        const { count, rows } = await Product.findAndCountAll({
          where: whereClause,
          include: [{ model: Category, attributes: ['category_name'] }],
          limit: parseInt(limit),
          offset: offset
        });
    
        res.status(200).json({
          products: rows,
          totalItems: count,
          totalPages: Math.ceil(count / parseInt(limit)),
          currentPage: parseInt(page)
        });
      } catch (error) {
        res.status(500).json({ message: 'Failed to get products', error: error.message });
      }
    };
    
   
// GET SINGLE PRODUCT
exports.getProduct = async (req, res) => {
    try {
      const { id } = req.params;
  
      const product = await Product.findByPk(id, {
        include: [{ model: Category, attributes: ['category_name'] }]
      });
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get product', error: error.message });
    }
  };
  
  // ADD PRODUCT
  exports.addProduct = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { category_id, product_name, purchase_price, selling_price, stock_quantity, minimum_stock } = req.body;
  
      // Check if category exists
      const category = await Category.findByPk(category_id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      // If a file was uploaded, build its accessible URL path
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
      const product = await Product.create({
        category_id,
        product_name,
        purchase_price,
        selling_price,
        stock_quantity: stock_quantity || 0,
        minimum_stock: minimum_stock || 5,
        image_url
      });
      // Auto-log initial stock as an expense if stock_quantity was provided
    if (stock_quantity && stock_quantity > 0) {
      const expenseAmount = parseFloat(purchase_price) * parseInt(stock_quantity);
      await Expense.create({
        description: `New Product - ${product_name} (${stock_quantity} units @ $${purchase_price})`,
        amount: expenseAmount,
        expense_date: new Date().toISOString().split('T')[0]
      });
    }
      res.status(201).json({ message: 'Product created successfully', product });
  
    } catch (error) {
      res.status(500).json({ message: 'Failed to create product', error: error.message });
    }
  };
  
  // UPDATE PRODUCT
  exports.updateProduct = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { id } = req.params;
      const { category_id, product_name, purchase_price, selling_price, minimum_stock } = req.body;
  
      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      // Check if category exists
      if (category_id) {
        const category = await Category.findByPk(category_id);
        if (!category) {
          return res.status(404).json({ message: 'Category not found' });
        }
      }
  
      // Only update image if a new one was uploaded, otherwise keep the existing one
      const updateData = { category_id, product_name, purchase_price, selling_price, minimum_stock };
      if (req.file) {
        updateData.image_url = `/uploads/${req.file.filename}`;
      }
  
      await product.update(updateData);
      res.status(200).json({ message: 'Product updated successfully', product });
  
    } catch (error) {
      res.status(500).json({ message: 'Failed to update product', error: error.message });
    }
  };
  
  // DELETE PRODUCT
  exports.deleteProduct = async (req, res) => {
    try {
      const { id } = req.params;
  
      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      await product.destroy();
      res.status(200).json({ message: 'Product deleted successfully' });
  
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete product', error: error.message });
    }
  };
