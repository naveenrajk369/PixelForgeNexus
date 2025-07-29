// controllers/project.controller.js

const Project = require('../models/project.model');
const User = require('../models/user.model');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Admin only)
exports.createProject = async (req, res) => {
    const { name, description, deadline, projectLeadEmail } = req.body;

    if (!name || !description || !deadline) {
        return res.status(400).json({ message: 'Please provide name, description, and deadline' });
    }

    try {
        const newProject = new Project({
            name,
            description,
            deadline,
        });

        if (projectLeadEmail) {
            const leadUser = await User.findOne({ email: projectLeadEmail });
            if (leadUser && (await leadUser.populate('role')).role.name === 'Project Lead') {
                newProject.projectLead = leadUser._id;
            } else {
                return res.status(400).json({ message: 'Project Lead not found or user is not a Project Lead' });
            }
        }

        const project = await newProject.save();
        res.status(201).json(project);

    } catch (error) {
        if (error.code === 11000) {
             return res.status(400).json({ message: 'A project with this name already exists.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all active projects
// @route   GET /api/projects
// @access  Private (All authenticated users)
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find({ status: 'Active' }).populate('projectLead', 'username email');
        res.status(200).json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark a project as completed
// @route   PATCH /api/projects/:id/complete
// @access  Private (Admin only)
exports.markProjectAsComplete = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.status = 'Completed';
        await project.save();

        res.status(200).json({ message: 'Project marked as completed', project });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Assign a developer to a specific project
// @route   PATCH /api/projects/:projectId/assign-developer
// @access  Private (Project Lead only)
exports.assignDeveloperToProject = async (req, res) => {
    const { developerEmail } = req.body;
    const { projectId } = req.params;

    try {
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        const developer = await User.findOne({ email: developerEmail });

        if (!developer) {
            return res.status(404).json({ message: 'Developer not found' });
        }

        // --- CORRECTED LOGIC ---
        // 1. Check if a project lead exists at all.
        // 2. Then, check if the logged-in user is that project lead.
        if (!project.projectLead || project.projectLead.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized. You are not the lead of this project.' });
        }

        if (!project.developers.includes(developer._id)) {
            project.developers.push(developer._id);
            await project.save();
        } else {
             return res.status(400).json({ message: 'Developer is already assigned to this project.' });
        }

        res.status(200).json({ message: 'Developer assigned successfully', project });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get projects assigned to the logged-in developer
// @route   GET /api/projects/assigned
// @access  Private (Developer only)
exports.getAssignedProjects = async (req, res) => {
    try {
        const projects = await Project.find({ developers: req.user.id, status: 'Active' })
            .populate('projectLead', 'username email');
        
        if (!projects) {
            return res.status(404).json({ message: 'No projects assigned to you.' });
        }

        res.status(200).json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};