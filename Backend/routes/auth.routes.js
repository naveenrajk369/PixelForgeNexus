// routes/auth.routes.js

const express = require('express');
const router = express.Router();
const { register, login, updatePassword, verifyLoginToken } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// @route   POST /api/auth/register
// @desc    Register a user
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login a user (Step 1)
router.post('/login', login);

// @route   POST /api/auth/verify-login
// @desc    Verify MFA token and complete login (Step 2)
router.post('/verify-login', verifyLoginToken);

// @route   PATCH /api/auth/update-password
// @desc    Update user password
router.patch('/update-password', protect, updatePassword);

module.exports = router;