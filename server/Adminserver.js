const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const adminRoutes = require('./Route/AdminRoutes');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use('/Food', express.static(path.join(__dirname, '../public/Food')));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Admin Server Running', message: 'Admin server is operational' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Admin server is running' });
});

// Connect to the same DB as main server
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecomm');

// Only use admin routes here
app.use(adminRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Admin server running on port ${PORT}`);
});