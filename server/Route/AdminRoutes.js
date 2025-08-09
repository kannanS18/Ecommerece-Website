const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../Models/AdminManagement');
const Order = require('../Models/Ordermodel');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_1234';
const ADMIN_KEY = process.env.ADMIN_KEY || 'fallback_admin_key';

// ────────────────────────────────
// Middleware: Auth check for protected routes
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ────────────────────────────────
// Verify token for frontend private route
router.get('/api/admin/verify-token', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ isAdmin: false });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded?.username) {
      return res.json({ isAdmin: true });
    } else {
      return res.status(403).json({ isAdmin: false });
    }
  } catch {
    return res.status(401).json({ isAdmin: false });
  }
});

// ────────────────────────────────
// Admin login
router.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const now = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  admin.lastLogin = now;

  const token = jwt.sign(
    { id: admin._id, username: admin.username, isSuperAdmin: admin.isSuperAdmin },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  await admin.save();
  res.json({ admin: { ...admin.toObject(), password: undefined }, token });
});

// ────────────────────────────────
// Admin logout
router.post('/api/admin/logout', async (req, res) => {
  const { username } = req.body;
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  await Admin.updateOne({ username }, { lastLogout: now });
  res.json({ success: true });
});

// ────────────────────────────────
// Get all admins (excluding passwords)
router.get('/api/admin/all', authMiddleware, async (req, res) => {
  const admins = await Admin.find({}, '-password');
  res.json(admins);
});

// ────────────────────────────────
// Edit admin
router.put('/api/admin/:id', authMiddleware, async (req, res) => {
  const { name, email, password, isSuperAdmin } = req.body;
  const updateFields = {
    'profile.name': name,
    'profile.email': email,
    isSuperAdmin
  };

  if (password && password.trim() !== '') {
    // Hash the new password
    const hash = await bcrypt.hash(password, 10);
    updateFields.password = hash;
  }

  const updated = await Admin.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true }
  );
  res.json(updated);
});

// ────────────────────────────────
// Delete admin
router.delete('/api/admin/:id', authMiddleware, async (req, res) => {
  await Admin.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ────────────────────────────────
// Add new admin
router.post('/api/admin/add', authMiddleware, async (req, res) => {
  const { username, password, name, email, key, currentAdmin } = req.body;

  const admin = await Admin.findOne({ username: currentAdmin });
  if (!admin || !admin.isSuperAdmin || key !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const existing = await Admin.findOne({ username });
  if (existing) return res.status(409).json({ error: 'Admin already exists' });

  const hash = await bcrypt.hash(password, 10);
  const newAdmin = new Admin({
    username,
    password: hash,
    profile: { name, email }
  });

  await newAdmin.save();

  const token = jwt.sign({ id: newAdmin._id, username: newAdmin.username }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ admin: { ...newAdmin.toObject(), password: undefined }, token });
});

// ────────────────────────────────
// Get profile of admin
router.get('/api/admin/profile/:username', authMiddleware, async (req, res) => {
  const admin = await Admin.findOne({ username: req.params.username });
  if (!admin) return res.status(404).json({ error: 'Not found' });

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      : null;

  res.json({
    profile: admin.profile,
    lastLogin: formatDate(admin.lastLogin),
    lastLogout: formatDate(admin.lastLogout)
  });
});

// ────────────────────────────────
// Get active orders
router.get('/api/admin/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['ordered', 'Reserved', 'out for delivery'] }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ────────────────────────────────
// Update order status
router.put('/api/admin/order/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    await order.save();

    if (status === 'out for delivery') {
      setTimeout(async () => {
        try {
          const liveOrder = await Order.findById(orderId);
          if (liveOrder && liveOrder.status === 'out for delivery') {
            liveOrder.status = 'delivered';
            await liveOrder.save();
          }
        } catch (err) {
          console.error('Auto-deliver failed:', err);
        }
      }, 10 * 1000); // 10 seconds
    }

    res.json({ success: true, updated: order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
