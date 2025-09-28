const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ status: 'Admin Server Running', message: 'Admin server is operational' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Admin server is running' });
});

// Basic admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, token: 'dummy-token' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Admin server running on port ${PORT}`);
});