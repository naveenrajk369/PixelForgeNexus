// routes/project.routes.js

const express = require('express');
const router = express.Router();

// Import controller and middleware
const { 
    createProject,
    getAllProjects,
    markProjectAsComplete,
    assignDeveloperToProject,
    getAssignedProjects // <-- ADD THIS
} = require('../controllers/project.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Create a new project (Admin only)
router.post('/', protect, authorize('Admin'), createProject);

// Get all active projects (Accessible to all logged-in users)
router.get('/', protect, getAllProjects);

// Get projects for the logged-in developer (Developer only) // <-- ADD THIS ROUTE
router.get('/assigned', protect, authorize('Developer'), getAssignedProjects);

// Mark a project as complete (Admin only)
router.patch('/:id/complete', protect, authorize('Admin'), markProjectAsComplete);

// Assign a developer to a project (Project Lead only)
router.patch('/:projectId/assign-developer', protect, authorize('Project Lead'), assignDeveloperToProject);

module.exports = router;