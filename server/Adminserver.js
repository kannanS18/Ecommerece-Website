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

// Connect to the same DB as main server
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecomm', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Only use admin routes here
app.use(adminRoutes);

const PORT = process.env.ADMIN_PORT || 5001;
app.listen(PORT, () => {
    console.log(`Admin server running on port ${PORT}`);
});