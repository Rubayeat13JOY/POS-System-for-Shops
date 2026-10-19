const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

// Generate Access Token (15 minutes)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate Refresh Token (7 days)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// REGISTER
exports.register = async (req, res) => {
  try {
    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'cashier'
    });

    res.status(201).json({
      message: 'User registered successfully'
    });

  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate refresh token only
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      token: refreshToken,
      user_id: user.id,
      expires_at: expiresAt
    });

    // Send refresh token only (no user info, no access token)
    res.status(200).json({
      message: 'Login successful',
      refreshToken
    });

  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// REFRESH TOKEN - returns access token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Check if refresh token exists in database
    const storedToken = await RefreshToken.findOne({
      where: { token: refreshToken }
    });

    if (!storedToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Check if refresh token is expired
    if (new Date() > storedToken.expires_at) {
      await storedToken.destroy();
      return res.status(403).json({ message: 'Refresh token expired, please login again' });
    }

    // Verify token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Get user
    const user = await User.findByPk(decoded.id);

    // Generate new access token only
    const accessToken = generateAccessToken(user);

    res.status(200).json({
      accessToken
    });

  } catch (error) {
    res.status(500).json({ message: 'Token refresh failed', error: error.message });
  }
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    // Delete refresh token from database
    await RefreshToken.destroy({ where: { token: refreshToken } });

    res.status(200).json({ message: 'Logged out successfully' });
    
  } catch (error) {
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};
// GET ALL USERS (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'is_active', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get users', error: error.message });
  }
};

// DEACTIVATE USER
exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.update({ is_active: false });
    res.status(200).json({ message: 'User deactivated', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to deactivate user', error: error.message });
  }
};

// REACTIVATE USER
exports.reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.update({ is_active: true });
    res.status(200).json({ message: 'User reactivated', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reactivate user', error: error.message });
  }
};