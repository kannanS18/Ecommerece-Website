const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
app.use(express.json());
app.use(cors());

// Health check endpoints - must be before other routes
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Admin server is running' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Admin server is running' });
});

// Debug route to test admin login
app.post('/api/admin/test-login', (req, res) => {
  console.log('Test login attempt:', req.body);
  res.json({ message: 'Test login endpoint working', body: req.body });
});



// Connect to MongoDB after health checks
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));
}

// Load admin routes with health check override
try {
  const adminRoutes = require('./Route/AdminRoutes');
  
  // Override verify-token for health check if no auth header
  app.get('/api/admin/verify-token', (req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(200).json({ status: 'OK', message: 'Health check' });
    }
    next();
  });
  
  app.use(adminRoutes);
} catch (err) {
  console.log('Admin routes loading error:', err.message);
  // Fallback health check if routes fail
  app.get('/api/admin/verify-token', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Health check fallback' });
  });
}

// Static files
const path = require('path');
app.use('/Food', express.static(path.join(__dirname, '../public/Food')));

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Admin server running on port ${PORT}`);
});