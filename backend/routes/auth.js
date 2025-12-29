const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Register Request:', req.body);
    
    const { email, password } = req.body;  // ✅ Removed 'name' from destructuring

    // Validation - only check email and password
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please enter email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists with this email' });
    }

    // Create new user (name will use default value 'User')
    const user = await User.create({
      email,
      password,
      // name is optional, will use default 'User'
    });

    console.log('✅ User created:', user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      msg: 'Registration successful',
    });
  } catch (error) {
    console.error('❌ Registration Error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'Email already registered' });
    }
    
    res.status(500).json({ 
      msg: 'Server error during registration',
      error: error.message 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login Request:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Please enter email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ msg: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid email or password' });
    }

    console.log('✅ Login successful:', user.email);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      msg: 'Login successful',
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
