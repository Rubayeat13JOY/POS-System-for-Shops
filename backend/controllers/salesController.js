const Sale = require('../models/Sale');
const SaleDetail = require('../models/SaleDetail');
const Product = require('../models/Product');
const Member = require('../models/Member');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

const POINTS_EARN_RATE = 10;      // 1 point per $10 spent
const POINTS_REDEEM_VALUE = 0.10; // 1 point = $0.10 discount

// Generate unique invoice number
const generateInvoiceNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}${day}-${random}`;
};

// CREATE SALE
exports.createSale = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      items,
      discount = 0,
      customer_mobile = null,
      member_id = null,
      redeem_points = 0
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cart items are required' });
    }

    let member = null;
    if (member_id) {
      member = await Member.findByPk(member_id, { transaction });
      if (!member) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Member not found' });
      }
    }

    // Validate redemption against balance
    const pointsToRedeem = parseInt(redeem_points) || 0;
    if (pointsToRedeem > 0) {
      if (!member) {
        await transaction.rollback();
        return res.status(400).json({ message: 'A member must be selected to redeem points' });
      }
      if (pointsToRedeem > member.points_balance) {
        await transaction.rollback();
        return res.status(400).json({ message: `Insufficient points. Available: ${member.points_balance}` });
      }
    }

    let total_amount = 0;
    const saleDetails = [];

    for (const item of items) {
      const { product_id, quantity } = item;

      if (!product_id || !quantity || quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Valid product ID and quantity required for each item' });
      }

      const product = await Product.findByPk(product_id, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ message: `Product with ID ${product_id} not found` });
      }

      if (product.stock_quantity < quantity) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Insufficient stock for ${product.product_name}. Available: ${product.stock_quantity}`
        });
      }

      const itemTotal = product.selling_price * quantity;
      total_amount += parseFloat(itemTotal);

      saleDetails.push({
        product_id,
        quantity,
        unit_price: product.selling_price
      });

      await product.update({
        stock_quantity: product.stock_quantity - quantity
      }, { transaction });
    }

    const invoice_no = generateInvoiceNo();
    const discountAmount = parseFloat(discount) || 0;
    const redeemDiscount = pointsToRedeem * POINTS_REDEEM_VALUE;
    const finalTotal = Math.max(0, total_amount - discountAmount - redeemDiscount);

    // Points earned on the amount actually paid
    const pointsEarned = member ? Math.floor(finalTotal / POINTS_EARN_RATE) : 0;

    const sale = await Sale.create({
      invoice_no,
      total_amount: finalTotal,
      discount: discountAmount,
      customer_mobile,
      sale_date: new Date(),
      member_id: member ? member.id : null,
      points_earned: pointsEarned,
      points_redeemed: pointsToRedeem
    }, { transaction });

    for (const detail of saleDetails) {
      await SaleDetail.create({
        sale_id: sale.id,
        ...detail
      }, { transaction });
    }

    // Update member's points balance: subtract redeemed, add earned
    if (member) {
      await member.update({
        points_balance: member.points_balance - pointsToRedeem + pointsEarned
      }, { transaction });
    }

    await transaction.commit();

    res.status(201).json({
      message: 'Sale created successfully',
      invoice_no: sale.invoice_no,
      total_amount: sale.total_amount,
      discount: sale.discount,
      customer_mobile: sale.customer_mobile,
      items_sold: saleDetails.length,
      points_earned: pointsEarned,
      points_redeemed: pointsToRedeem,
      member_points_balance: member ? member.points_balance - pointsToRedeem + pointsEarned : null
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Failed to create sale', error: error.message });
  }
};

// GET ALL SALES (Invoice History)
exports.getAllSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search.trim() !== '') {
      where[Op.or] = [
        { invoice_no: { [Op.like]: `%${search}%` } },
        { customer_mobile: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Sale.findAndCountAll({
      where,
      order: [['sale_date', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.status(200).json({
      sales: rows,
      totalItems: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page)
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to get sales', error: error.message });
  }
};

// GET SINGLE INVOICE (with full details)
exports.getInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findByPk(id, {
      include: [{
        model: SaleDetail,
        include: [{ model: Product, attributes: ['product_name'] }]
      }]
    });

    if (!sale) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json(sale);

  } catch (error) {
    res.status(500).json({ message: 'Failed to get invoice', error: error.message });
  }
};