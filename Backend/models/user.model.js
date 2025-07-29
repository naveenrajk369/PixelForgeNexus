// models/user.model.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    // --- NEW MFA FIELDS ---
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String }, // Stores the verified secret
    mfaTempSecret: { type: String } // Stores the secret during setup
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);