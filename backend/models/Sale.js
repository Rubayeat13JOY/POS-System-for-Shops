const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoice_no: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  customer_mobile: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sale_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  member_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  points_earned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  points_redeemed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
  },
  {
  timestamps: true
});

module.exports = Sale;