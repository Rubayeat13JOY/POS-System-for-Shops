const { Sequelize } = require('sequelize');
const config = require('./config.json');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connected Successfully via Sequelize!');
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
};

testConnection();

module.exports = sequelize;