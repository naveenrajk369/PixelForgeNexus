// controllers/auth.controller.js

const User = require('../models/user.model');
const Role = require('../models/role.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

// @desc   Register a new user (Admin-only in the future)
// @route  POST /api/auth/register
exports.register = async (req, res) => {
    const { username, email, password, roleName } = req.body;

    try {
        // 1. Check if user or email already exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User or email already exists' });
        }

        // 2. Find the role ObjectId from the roleName
        const role = await Role.findOne({ name: roleName });
        if (!role) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        // 3. Create new user instance
        user = new User({
            username,
            email,
            password,
            role: role._id,
        });

        // 4. Hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 5. Save the user to the database
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// @desc   Authenticate user & get token
// @route  POST /api/auth/login
// controllers/auth.controller.js
// ... (keep requires and other functions)

// @desc   Authenticate user (Step 1: Password check)
// @route  POST /api/auth/login
exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username }).populate('role', 'name');
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // --- MODIFIED LOGIC ---
        if (user.mfaEnabled) {
            // If MFA is enabled, do not send JWT.
            // Send a temporary signal that MFA is required.
            return res.status(200).json({ mfaRequired: true, userId: user.id });
        }

        // If MFA is not enabled, log in directly
        const payload = { user: { id: user.id, role: user.role.name } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// --- NEW FUNCTION ---
// @desc   Verify MFA token and complete login (Step 2)
// @route  POST /api/auth/verify-login
exports.verifyLoginToken = async (req, res) => {
    const { userId, token } = req.body;
    try {
        const user = await User.findById(userId).populate('role', 'name');
        if (!user) {
            return res.status(400).json({ message: 'User not found.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            // MFA token is correct, now issue the final JWT
            const payload = { user: { id: user.id, role: user.role.name } };
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, finalToken) => {
                if (err) throw err;
                res.json({ token: finalToken });
            });
        } else {
            res.status(400).json({ message: 'Invalid MFA token.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during MFA login.' });
    }
};

// controllers/auth.controller.js
// ... (keep existing functions)

// @desc   Update user password
// @route  PATCH /api/auth/update-password
// @access Private
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide current and new passwords' });
    }

    try {
        // req.user.id is from the 'protect' middleware
        const user = await User.findById(req.user.id);

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};