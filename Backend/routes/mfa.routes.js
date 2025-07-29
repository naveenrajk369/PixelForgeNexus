// routes/mfa.routes.js
const express = require('express');
const router = express.Router();
const { generateMfaSecret, verifyMfaToken } = require('../controllers/mfa.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/generate', protect, generateMfaSecret);
router.post('/verify', protect, verifyMfaToken);

module.exports = router;