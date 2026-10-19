const Sale = require('../models/Sale');
const SaleDetail = require('../models/SaleDetail');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

// FINANCIAL SUMMARY (Income, Expense, Profit)
exports.getFinancialSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Build date filter if provided
    const dateFilter = {};
    if (start_date && end_date) {
      dateFilter[Op.between] = [start_date, end_date];
    }

    // Get total income from sales
    const sales = await Sale.findAll({
      where: start_date && end_date ? { sale_date: dateFilter } : {}
    });
    const totalIncome = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);

    // Get total expenses
    const expenses = await Expense.findAll({
      where: start_date && end_date ? { expense_date: dateFilter } : {}
    });
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    // Calculate profit
    const profit = totalIncome - totalExpenses;

    res.status(200).json({
      period: start_date && end_date ? `${start_date} to ${end_date}` : 'All time',
      total_income: parseFloat(totalIncome.toFixed(2)),
      total_expenses: parseFloat(totalExpenses.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      total_sales_count: sales.length,
      total_expenses_count: expenses.length
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to get financial summary', error: error.message });
  }
};

// CATEGORY-WISE SALES REPORT
exports.getCategoryWiseSales = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const saleDateFilter = {};
    if (start_date && end_date) {
      saleDateFilter[Op.between] = [start_date, end_date];
    }

    // Get all sale details with product and category info
    const saleDetails = await SaleDetail.findAll({
      include: [
        {
          model: Product,
          attributes: ['product_name', 'category_id'],
          include: [{ model: Category, attributes: ['category_name'] }]
        },
        {
          model: Sale,
          attributes: ['sale_date'],
          where: start_date && end_date ? { sale_date: saleDateFilter } : {}
        }
      ]
    });

    // Group by category
    const categoryReport = {};

    saleDetails.forEach(detail => {
      const categoryName = detail.Product.Category.category_name;
      const itemTotal = detail.quantity * parseFloat(detail.unit_price);

      if (!categoryReport[categoryName]) {
        categoryReport[categoryName] = {
          category_name: categoryName,
          total_quantity_sold: 0,
          total_revenue: 0
        };
      }

      categoryReport[categoryName].total_quantity_sold += detail.quantity;
      categoryReport[categoryName].total_revenue += itemTotal;
    });

    // Convert to array and round numbers
    const report = Object.values(categoryReport).map(cat => ({
      ...cat,
      total_revenue: parseFloat(cat.total_revenue.toFixed(2))
    }));

    // Sort by highest revenue first
    report.sort((a, b) => b.total_revenue - a.total_revenue);

    res.status(200).json({
      period: start_date && end_date ? `${start_date} to ${end_date}` : 'All time',
      category_report: report
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to get category sales report', error: error.message });
  }
};

// DAILY/MONTHLY SUMMARY
exports.getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const sales = await Sale.findAll({ where: { sale_date: targetDate } });
    const totalIncome = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);

    const expenses = await Expense.findAll({ where: { expense_date: targetDate } });
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    res.status(200).json({
      date: targetDate,
      total_income: parseFloat(totalIncome.toFixed(2)),
      total_expenses: parseFloat(totalExpenses.toFixed(2)),
      profit: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      sales_count: sales.length
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to get daily summary', error: error.message });
  }
};

// SALES REPORT (weekly / monthly / yearly)
exports.getSalesReport = async (req, res) => {
  try {
    const { period = 'monthly', start_date, end_date } = req.query;

    let groupFormat;
    if (period === 'weekly') groupFormat = '%x-W%v';
    else if (period === 'yearly') groupFormat = '%Y';
    else groupFormat = '%Y-%m';

    const where = {};
    if (start_date && end_date) {
      where.sale_date = { [Op.between]: [start_date, end_date] };
    }

    const rows = await Sale.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('sale_date'), groupFormat), 'period_label'],
        [sequelize.fn('MIN', sequelize.col('sale_date')), 'period_start'],
        [sequelize.fn('MAX', sequelize.col('sale_date')), 'period_end'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_income'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'sales_count']
      ],
      where,
      group: ['period_label'],
      order: [[sequelize.literal('period_label'), 'ASC']],
      raw: true
    });

    const report = rows.map(row => ({
      period: row.period_label,
      period_start: row.period_start,
      period_end: row.period_end,
      total_income: parseFloat(parseFloat(row.total_income).toFixed(2)),
      sales_count: parseInt(row.sales_count)
    }));

    res.status(200).json({ period_type: period, report });

  } catch (error) {
    res.status(500).json({ message: 'Failed to get sales report', error: error.message });
  }
};

// PERIOD DRILL-DOWN: category & product breakdown for a specific day/week/month/year
exports.getPeriodDetail = async (req, res) => {
  try {
    const { period_type = 'day', date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'date is required' });
    }

    const ref = new Date(date);
    let start, end;

    if (period_type === 'day') {
      start = end = date;
    } else if (period_type === 'week') {
      const day = ref.getDay(); // 0 = Sunday
      const monday = new Date(ref);
      monday.setDate(ref.getDate() - ((day + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      start = monday.toISOString().split('T')[0];
      end = sunday.toISOString().split('T')[0];
    } else if (period_type === 'month') {
      start = new Date(ref.getFullYear(), ref.getMonth(), 1).toISOString().split('T')[0];
      end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (period_type === 'year') {
      start = `${ref.getFullYear()}-01-01`;
      end = `${ref.getFullYear()}-12-31`;
    } else {
      return res.status(400).json({ message: 'Invalid period_type' });
    }

    const saleDetails = await SaleDetail.findAll({
      include: [
        {
          model: Product,
          attributes: ['product_name', 'category_id'],
          include: [{ model: Category, attributes: ['category_name'] }]
        },
        {
          model: Sale,
          attributes: ['sale_date'],
          where: { sale_date: { [Op.between]: [start, end] } }
        }
      ]
    });

    const categoryMap = {};
    const productMap = {};

    saleDetails.forEach(detail => {
      const catName = detail.Product.Category.category_name;
      const prodName = detail.Product.product_name;
      const lineTotal = detail.quantity * parseFloat(detail.unit_price);

      if (!categoryMap[catName]) categoryMap[catName] = { category_name: catName, quantity_sold: 0, revenue: 0 };
      categoryMap[catName].quantity_sold += detail.quantity;
      categoryMap[catName].revenue += lineTotal;

      if (!productMap[prodName]) productMap[prodName] = { product_name: prodName, category_name: catName, quantity_sold: 0, revenue: 0 };
      productMap[prodName].quantity_sold += detail.quantity;
      productMap[prodName].revenue += lineTotal;
    });

    const categoryBreakdown = Object.values(categoryMap)
      .map(c => ({ ...c, revenue: parseFloat(c.revenue.toFixed(2)) }))
      .sort((a, b) => b.revenue - a.revenue);

    const productBreakdown = Object.values(productMap)
      .map(p => ({ ...p, revenue: parseFloat(p.revenue.toFixed(2)) }))
      .sort((a, b) => b.revenue - a.revenue);

      const summarySales = await Sale.findAll({
        where: { sale_date: { [Op.between]: [start, end] } },
        attributes: ['total_amount']
      });
      const totalIncome = summarySales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
    
      res.status(200).json({
      period_type,
      start_date: start,
      end_date: end,
      sales_count: summarySales.length,
      total_income: parseFloat(totalIncome.toFixed(2)),
      category_breakdown: categoryBreakdown,
      product_breakdown: productBreakdown
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to get period detail', error: error.message });
  }
};