// routes/document.routes.js

const express = require('express');
const router = express.Router();
const { uploadDocument, getProjectDocuments, downloadDocument } = require('../controllers/document.controller');
const { protect } = require('../middleware/auth.middleware');

// Note: Authorization is handled inside the controller for these routes due to its complexity.

// Upload a document to a project
router.post('/:projectId', protect, uploadDocument);

// Get a list of documents for a project
router.get('/:projectId', protect, getProjectDocuments);

// Download a specific document
router.get('/download/:docId', protect, downloadDocument);

module.exports = router;