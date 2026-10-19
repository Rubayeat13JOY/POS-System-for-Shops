const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  product_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  purchase_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  selling_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  minimum_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Product;