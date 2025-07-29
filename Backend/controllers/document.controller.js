// controllers/document.controller.js

const multer = require('multer');
const path = require('path');
const Document = require('../models/document.model');
const Project = require('../models/project.model');
const fs = require('fs');

// --- Multer Configuration for File Storage ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // The directory where files will be stored
    },
    filename: function (req, file, cb) {
        // Create a unique filename to prevent overwriting
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage }).single('document'); // 'document' is the field name in the form-data

// @desc    Upload a document for a project
// @route   POST /api/documents/:projectId
// @access  Private (Admin or Project Lead of the project)
exports.uploadDocument = async (req, res) => {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }

    // Authorization Check:
    // Allow if user is an Admin OR the Project Lead for this specific project
    const isProjectLead = project.projectLead && project.projectLead.toString() === req.user.id;
    const isAdmin = req.user.role === 'Admin';

    if (!isAdmin && !isProjectLead) {
        return res.status(403).json({ message: 'Not authorized to upload to this project' });
    }

    // Use the multer 'upload' middleware
    upload(req, res, async function (err) {
        if (err) {
            return res.status(500).json({ message: 'File upload error', error: err });
        }
        if (!req.file) {
             return res.status(400).json({ message: 'Please upload a file' });
        }

        // Create a new document record in the database
        const newDocument = new Document({
            originalFilename: req.file.originalname,
            storageFilename: req.file.filename,
            mimeType: req.file.mimetype,
            size: req.file.size,
            project: projectId,
            uploadedBy: req.user.id
        });

        await newDocument.save();
        res.status(201).json({ message: 'File uploaded successfully', document: newDocument });
    });
};

// @desc    Get all documents for a specific project
// @route   GET /api/documents/:projectId
// @access  Private (Users assigned to the project)
exports.getProjectDocuments = async (req, res) => {
    // This endpoint can be further secured to ensure user is on the project
    try {
        const documents = await Document.find({ project: req.params.projectId }).populate('uploadedBy', 'username');
        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Download a specific document
// @route   GET /api/documents/download/:docId
// @access  Private (Users assigned to the project)
// controllers/document.controller.js
// ... (keep other requires and functions)

// @desc    Download a specific document
// @route   GET /api/documents/download/:docId
// @access  Private (Users assigned to the project)
exports.downloadDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.docId);

        // Check if the document record exists and has a filename
        if (!document || !document.storageFilename) {
            return res.status(404).json({ message: 'Document record not found or is invalid.' });
        }

        const filePath = path.join(__dirname, '..', 'uploads', document.storageFilename);

        // NEW: Check if file physically exists on the server before sending
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Error: File not found on disk -', filePath);
                return res.status(404).json({ message: 'File not found on server.' });
            }

            // If file exists, send it for download
            res.download(filePath, document.originalFilename);
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};