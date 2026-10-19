const Product = require('../models/Product');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const sequelize = require('../config/db');

// GET ALL INVENTORY
exports.getInventory = async (req, res) => {
    try {
      const products = await Product.findAll({
        include: [{ model: Category, attributes: ['category_name'] }]
      });
  
      const inventory = products.map(product => ({
        id: product.id,
        product_name: product.product_name,
        category_name: product.Category.category_name,
        stock_quantity: product.stock_quantity,
        minimum_stock: product.minimum_stock,
        purchase_price: product.purchase_price,
        selling_price: product.selling_price,
        updatedAt: product.updatedAt
      }));

      res.status(200).json(inventory);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get inventory' });
    }
  };

  // STOCK IN (Add stock to a product, and log the purchase cost as an expense)
exports.stockIn = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { product_id, quantity } = req.body;
  
      if (!product_id || !quantity || quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Valid product ID and quantity required' });
      }
  
      const product = await Product.findByPk(product_id, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Product not found' });
      }
  
      const previousQuantity = product.stock_quantity;
      const qty = parseInt(quantity);
      const newQuantity = previousQuantity + qty;
      await product.update({ stock_quantity: newQuantity }, { transaction });

      const expenseAmount = qty * parseFloat(product.purchase_price);
      await Expense.create({
        description: `Stock-in: ${product.product_name} (${qty} units @ Tk ${product.purchase_price})`,
        amount: expenseAmount,
        expense_date: new Date().toISOString().split('T')[0]
      }, { transaction });

      await transaction.commit();

      res.status(200).json({
        message: 'Stock added successfully',
        product_name: product.product_name,
        previous_quantity: previousQuantity,
        added_quantity: qty,
        new_quantity: newQuantity,
        expense_logged: expenseAmount
      });
  
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ message: 'Failed to add stock', error: error.message });
    }
  };