const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
  deadline: { type: Date, required: true },
  // A project can have one lead and multiple developers
  projectLead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  developers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);