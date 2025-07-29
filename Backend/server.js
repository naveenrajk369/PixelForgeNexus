// server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Import the cors package

// Import routes
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const documentRoutes = require('./routes/document.routes');
const mfaRoutes = require('./routes/mfa.routes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

// --- SETUP MIDDLEWARE ---
app.use(cors()); // Use the cors middleware to allow requests from your frontend
app.use(express.json()); // Body Parser Middleware

// --- API ROUTES ---
// Define the test route
app.get('/', (req, res) => {
  res.send('PixelForge Nexus API is running...');
});

// Use the functional routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/mfa', mfaRoutes);

// --- SERVER STARTUP LOGIC ---
const startServer = async () => {
  try {
    // First, connect to the database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully!');

    // Only after the DB connection is successful, start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });

  } catch (error) {
    // If the database connection fails, log the error and exit
    console.error('❌ Could not connect to MongoDB:', error.message);
    process.exit(1);
  }
};

// Call the function to start the server
startServer();
