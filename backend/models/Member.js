const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Member = sequelize.define('Member', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  card_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  points_balance: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
  }
}, {
  timestamps: true
});

module.exports = Member;