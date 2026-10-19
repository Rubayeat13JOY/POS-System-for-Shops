const dotenv = require('dotenv');
const result = dotenv.config();


const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/db');

// Import models
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Sale = require('./models/Sale');
const SaleDetail = require('./models/SaleDetail');
const Expense = require('./models/Expense');
const RefreshToken = require('./models/RefreshToken');
const Member = require('./models/Member');

// Import routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const accountingRoutes = require('./routes/accountingRoutes');
const marketBasketRoutes = require('./routes/marketBasketRoutes');
const memberRoutes = require('./routes/memberRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(cookieParser());

// Define associations
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

Sale.hasMany(SaleDetail, { foreignKey: 'sale_id' });
SaleDetail.belongsTo(Sale, { foreignKey: 'sale_id' });

Product.hasMany(SaleDetail, { foreignKey: 'product_id' });
SaleDetail.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

Member.hasMany(Sale, { foreignKey: 'member_id' });
Sale.belongsTo(Member, { foreignKey: 'member_id' });


// Health Check API
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'POS System is running',
    timestamp: new Date()
  });
});

app.get('/', (req, res) => {
  res.send('POS Backend is running!');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/market-basket', marketBasketRoutes);
app.use('/api/members', memberRoutes);
// Sync database
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established!');
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});