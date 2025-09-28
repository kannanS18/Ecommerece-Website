const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const adminRoutes = require('./Route/AdminRoutes');
const fs = require('fs');
const path = require('path');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
app.use(express.json());
app.use(cors());
app.use('/Food', express.static(path.join(__dirname, '../public/Food')));

// Connect to the same DB as main server
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecomm');

// Debug middleware to log requests
app.use('/api/admin', (req, res, next) => {
  console.log(`Admin API call: ${req.method} ${req.path}`);
  console.log('Headers:', req.headers.authorization ? 'Token present' : 'No token');
  next();
});

// Only use admin routes here
app.use(adminRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Admin server running on port ${PORT}`);
});