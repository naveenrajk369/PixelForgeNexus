const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  originalFilename: { type: String, required: true },
  storageFilename: { type: String, required: true, unique: true }, // The randomized name (UUID)
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);