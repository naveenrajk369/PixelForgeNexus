// controllers/mfa.controller.js
const User = require('../models/user.model');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// @desc    Generate a new MFA secret and QR code for the user
// @route   GET /api/mfa/generate
exports.generateMfaSecret = async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `PixelForge Nexus (${req.user.id})` // Shows up in the user's authenticator app
        });

        // Temporarily store the secret before it's verified
        await User.findByIdAndUpdate(req.user.id, { mfaTempSecret: secret.base32 });

        // Generate a QR code for the user to scan
        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                throw new Error('Could not generate QR code.');
            }
            res.json({ qrCodeDataUri: data_url, mfaSecret: secret.base32 });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error generating MFA secret.' });
    }
};

// @desc    Verify the token and enable MFA for the user
// @route   POST /api/mfa/verify
exports.verifyMfaToken = async (req, res) => {
    const { token } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user.mfaTempSecret) {
            return res.status(400).json({ message: 'MFA secret not generated yet.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfaTempSecret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            // Verification successful, permanently save the secret and enable MFA
            user.mfaSecret = user.mfaTempSecret;
            user.mfaTempSecret = undefined; // Clear the temporary secret
            user.mfaEnabled = true;
            await user.save();
            res.json({ message: 'MFA has been enabled successfully.' });
        } else {
            res.status(400).json({ message: 'Invalid MFA token.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error verifying MFA token.' });
    }
};