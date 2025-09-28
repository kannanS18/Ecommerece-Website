const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./Models/usedmodel');
const Item = require('./Models/itemModel');
const Review = require('./Models/reviewModel');
const bycrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'JWT_SECRET=super_secret_key_1234567890';
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const adminRoutes = require('./Route/AdminRoutes'); 
const Order = require('./Models/Ordermodel');
const nodemailer = require('nodemailer');
const downloadRoute = require('./Route/downlodeRoute'); // Import the download route
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_KEY);


const app = express();
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use('/api/order', downloadRoute); // Use the download route
app.use('/Food', express.static(path.join(__dirname, '../public/Food')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});


console.log('🔍 MONGO_URI:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecomm')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    // Don't exit, let server run without DB for health checks
  });

const storage = multer.memoryStorage();
const upload = multer(
    { storage },
);



app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const emailUser = await User.findOne({ registerEmail: email });
        if (emailUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        // Check for existing name
        const nameUser = await User.findOne({ registerName: name });
        if (nameUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash the password before saving
        const hashedPassword = await bycrypt.hash(password, 10);
        const user = await User.create({ registerName: name, registerEmail: email, registerPassword: hashedPassword });

        // Create JWT token
        const token = jwt.sign(
            { id: user._id, name: user.registerName, email: user.registerEmail },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.status(200).json({
            message: 'Registration successful',
            token,
            user: { id: user._id, name: user.registerName, email: user.registerEmail }
        });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed', details: err });
        console.error('Registration error:', err);
    }
});


app.post('/api/login',async (req, res) => {
    const { loginUser, loginPassword } = req.body;
    let query = {};
    if (loginUser.includes('@gmail.com')) {
        query = { registerEmail: loginUser };
    } else {
        query = { registerName: loginUser};
    }
   try {
        const user = await User.findOne(query);
        if (!user) {
            return res.status(401).json({ error: 'Invalid username/email or password' });
        }
        const isPasswordValid = await bycrypt.compare(loginPassword, user.registerPassword);
        console.log('Password valid:', isPasswordValid);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username/email or password' });
        }
        // Create JWT token
        const token = jwt.sign(
            { id: user._id, name: user.registerName, email: user.registerEmail },
            JWT_SECRET,
            { expiresIn: '2h' }
        );
        return res.json({ message: 'Login successful', token, user: { id: user._id, name: user.registerName, email: user.registerEmail } });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err });
    }
});


app.post('/api/forgot-password', async (req, res) => {
    const { identifier, newPassword } = req.body;


if (!newPassword) {
        // Try to find by email or username
        const user = await User.findOne({
            $or: [
                { registerEmail: identifier },
                { registerName: identifier }
            ]
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ message: 'User exists' });
    }


    const user = await User.findOne({
        $or: [
            { registerEmail: identifier },
            { registerName: identifier }
        ]
    });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const hashedPassword = await bycrypt.hash(newPassword, 10);
    user.registerPassword = hashedPassword;
    await user.save();
    return res.json({ message: 'Password reset successful' });
});



app.get('/api/user/:email', async (req, res) => {
  const user = await User.findOne({ registerEmail: req.params.email });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    // Legacy format for compatibility
    name: user.registerName,
    email: user.registerEmail,
    // New format
    registerName: user.registerName,
    registerEmail: user.registerEmail,
    userName: user.userName,
    address: user.address,
    phone: user.phone,
    gender: user.gender,
    age: user.age,
    img: user.img || null
  });
});
const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']; 
app.put('/api/user/:email', (req, res, next) => {
  upload.single('img')(req, res, function (err) {
    next();
  });
}, async (req, res) => {
  try {
    const Name = req.body.name;
    const existingUser = await User.findOne({ registerName: Name, registerEmail: { $ne: req.params.email } });
    if (existingUser) { 
      return res.status(400).json({ error: 'Username already exists' });
    }

    const updateObj = {
      registerName: req.body.name,
      userName: req.body.userName,
      address: req.body.address,
      phone: req.body.phone,
      gender: req.body.gender,
      age: req.body.age
    };

    // Remove image if requested
    if (req.body.removeImg) {
      updateObj.img = null;
    }

    // If a new image is uploaded, only allow PNG
    if (req.file) {
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Only PNG images are allowed.' });
      }
      updateObj.img = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    const updated = await User.findOneAndUpdate(
      { registerEmail: req.params.email },
      updateObj,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });

    // Return the user in the same structure as GET
    res.json({
      // Legacy format for compatibility
      name: updated.registerName,
      email: updated.registerEmail,
      // New format
      registerName: updated.registerName,
      registerEmail: updated.registerEmail,
      userName: updated.userName,
      address: updated.address,
      phone: updated.phone,
      gender: updated.gender,
      age: updated.age,
      img: updated.img || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});



app.get('/api/items', async (req, res) => {
  try {
    console.log('🔍 Database name:', mongoose.connection.db.databaseName);
    
    // Test raw MongoDB query
    const rawItems = await mongoose.connection.db.collection('items').find({}).limit(1).toArray();
    console.log('🔍 Raw items sample:', rawItems.length > 0 ? Object.keys(rawItems[0]) : 'No items');
    
    const items = await Item.find();
    console.log('🔍 Items found via model:', items.length);
    res.json(items);
  } catch (err) {
    console.error('❌ Items error:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Clear guest cart
app.post('/api/clear-guest-cart', (req, res) => {
  res.json({ success: true, message: 'Guest cart cleared' });
});



const storages = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/Food'));
  },
  filename: function (req, file, cb) {
    // Save with original name or you can use Date.now() + ext for uniqueness
    cb(null, file.originalname);
  }
});
const uploads = multer({ storage: storages });

// Update your POST /api/items endpoint:
app.post('/api/items', uploads.single('image'), async (req, res) => {
  try {
    const data = req.body;

    const item = new Item(data);
    await item.save();
    
    // Auto-assign nutrition and instructions
    await autoAssign();
    
    res.status(201).json(item);
    
  } catch (err) {
    res.status(400).json({ error: 'Failed to add item', details: err });
  }
});


app.delete('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Delete the associated image file if it exists
    if (item.Image_Name) {
      const extensions = ['.jpg', '.jpeg', '.png']; // Adjust based on what you support
      for (let ext of extensions) {
        const imagePath = path.join(__dirname, '../public/Food', item.Image_Name + ext);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Deleted image file: ${imagePath}`);
          break; // Stop after first match
        }
      }
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});


app.put('/api/items/:id', async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// Place new order (checks user profile for address/phone)
app.post('/api/order', async (req, res) => {
  const { registerEmail, registerName, address, phone, items, total, msg, type, dineInDate, dineInTime } = req.body;

  const user = await User.findOne({ registerEmail });
  if (!user || !user.address || !user.phone) {
    return res.status(400).json({ error: 'Complete profile required' });
  }

  if (type === 'dine in' && dineInDate && dineInTime) {
    const [toTime] = dineInTime.split(' - ').slice(-1);
    const [hourMin, period] = toTime.split(' ');
    let [hour, minute] = hourMin.split(':').map(Number);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    const dineEnd = new Date(`${dineInDate}T${hour.toString().padStart(2, '0')}:${minute}:00`);
    if (new Date() > dineEnd) {
      return res.status(400).json({ error: 'Cannot book dine-in in the past' });
    }
  }

  const gst = Math.round(total * 0.05); // 5% GST
  const finalTotal = total + gst;

  const order = new Order({
    registerEmail,
    registerName,
    address,
    phone,
    items,
    total,
    gst,
    finalTotal,
    msg,
    status: 'pending',
    isFinalised: false,
    type,
    dineInDate: type === 'dine in' ? dineInDate : null,
    dineInTime: type === 'dine in' ? dineInTime : null
  });

  await order.save();
  res.json({ success: true, order });
});

// Update order
app.put('/api/order/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || order.isFinalised) return res.status(400).json({ error: 'Cannot update' });

  Object.assign(order, req.body);

  // Always recalculate GST and finalTotal
  const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  order.total = total;
  order.gst = Math.round(total * 0.05);
  order.finalTotal = total + order.gst;

  await order.save();
  res.json(order);
});

// Finalise
app.put('/api/order/:orderId/finalise', async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.isFinalised = true;

  if (order.type === 'take away') {
    order.status = 'ordered';
    order.estimatedTime = new Date(Date.now() + 30 * 60000);
  } else if (order.type === 'dine in') {
    order.status = 'Reserved';
  }

  await order.save();
  res.json({ success: true, order });
});

// Delete
app.delete('/api/order/:orderId', async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order || order.isFinalised) return res.status(400).json({ error: 'Cannot delete' });

  await Order.findByIdAndDelete(req.params.orderId);
  res.json({ success: true });
});

// Get all orders for user
app.get('/api/order/:registerEmail', async (req, res) => {
  const orders = await Order.find({ registerEmail: req.params.registerEmail });
  res.json(orders);
});

// Time slot count (for dine in)
app.get('/api/timeslot-counts', async (req, res) => {
  const orders = await Order.find({ isFinalised: true, status: 'ordered', dineInTime: { $ne: null }, dineInDate: { $ne: null } });

  const slotCount = {};
  orders.forEach(order => {
    const key = `${order.dineInDate}_${order.dineInTime}`;
    slotCount[key] = (slotCount[key] || 0) + 1;
  });

  res.json(slotCount);
});

// Reorder
app.post('/api/order/:order_id/reorder', async (req, res) => {
  const oldOrder = await Order.findById(req.params.order_id);
  if (!oldOrder) return res.status(404).json({ error: 'Order not found' });

  const newOrder = new Order({
    registerEmail: oldOrder.registerEmail,
    registerName: oldOrder.registerName,
    address: oldOrder.address,
    phone: oldOrder.phone,
    items: oldOrder.items,
    total: oldOrder.total,
    msg: oldOrder.msg,
    status: 'pending',
    gst: oldOrder.gst,
    finalTotal: oldOrder.finalTotal,
    isFinalised: false,
    type: oldOrder.type,
    dineInDate: null,
    dineInTime: null
  });

  await newOrder.save();
  res.status(201).json(newOrder);
});

// Update reservation statuses
app.get('/api/update-reservation-statuses', async (req, res) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const orders = await Order.find({
    type: 'dine in',
    status: 'Reserved',
    isFinalised: true,
    dineInDate: { $lte: today }
  });

  for (let order of orders) {
    const endTimeStr = order.dineInTime?.split(' - ')[1];
    if (!endTimeStr) continue;

    const [hourMin, ampm] = endTimeStr.split(' ');
    let [hour, minute] = hourMin.split(':').map(Number);
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    const slotEnd = new Date(`${order.dineInDate}T${hour.toString().padStart(2, '0')}:${minute}:00`);
    if (now > slotEnd) {
      order.status = 'Reservation Over';
      await order.save();
    }
  }

  res.json({ message: 'Statuses updated' });
});




setInterval(async () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const orders = await Order.find({
    type: 'dine in',
    status: 'Reserved',
    isFinalised: true,
    dineInDate: { $lte: today }
  });

  for (let order of orders) {
    const endTimeStr = order.dineInTime?.split(' - ')[1];
    if (!endTimeStr) continue;

    const [hourMin, ampm] = endTimeStr.split(' ');
    let [hour, minute] = hourMin.split(':').map(Number);
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    const [year, month, day] = order.dineInDate.split('-').map(Number);
    const slotEnd = new Date(year, month - 1, day, hour, minute);

    if (now > slotEnd) {
      console.log(`✅ Manually updating order ${order._id}`);
      order.status = 'Reservation Over';
      await order.save();
    }
  }

  console.log('✅ Reservation status check complete');
}, 5 * 60 * 1000);

app.post('/api/payment/create-checkout-session', async (req, res) => {
  const { items,final, order_id, currency } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: items.map((item, idx) => ({
      price_data: {
        currency: currency || 'inr',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round((item.price + Math.round(item.price* 0.05)) * 100), // price already converted
        // total_amount: Math.round(item.price * item.quantity * 100),
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?order_id=${order_id}`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
  });

  res.json(session);
});



const contactSchema = new mongoose.Schema({
  Name: String,
  email: String,
  category: String,
  message: String,
});
const Contact = mongoose.model('Contact', contactSchema);

// API endpoint to receive form data and send email
app.post('/api/contact', async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();

    // Send email notification
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'mseckannan.s@gmail.com',      // your Gmail address
        pass: 'jbvp zgoc rbsp cmyc',         // your Gmail App Password
      },
    });

    let mailOptions = {
      from: req.body.email,              // user's email from the form
      to: 'mseckannan.s@gmail.com',      // your email (recipient)
      subject: 'New Contact Form Submission',
      text: `Name: ${req.body.Name}\nEmail: ${req.body.email}\nCategory: ${req.body.category}\nMessage: ${req.body.message}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).send({ message: 'Contact saved and email sent!' });
  } catch (err) {
    console.error('contact form error', err);
    res.status(500).send({ error: 'Failed to save contact or send email' });
  }
});




const autoAssign = require('./Updatedata');
const updateRatings = require('./updateRatings');

app.post('/api/admin/assign-nutrition', async (req, res) => {
  try {
    await autoAssign(); // You only need to call it if it handles everything internally
    console.log('✅ Nutrition and instructions updated');
    res.send("Nutrition and instructions updated.");
  } catch (error) {
    console.error('❌ Error running nutrition script:', error);
    res.status(500).send("Failed to update.");
  }
});

app.post('/api/admin/update-ratings', async (req, res) => {
  try {
    await updateRatings();
    console.log('✅ Rating fields updated');
    res.send("Rating fields updated for all items.");
  } catch (error) {
    console.error('❌ Error updating ratings:', error);
    res.status(500).send("Failed to update ratings.");
  }
});

app.get('/api/admin/fix-review-ids', async (req, res) => {
  try {
    // Check all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    let debugInfo = 'Collections in database:\n';
    collections.forEach(col => {
      debugInfo += `- ${col.name}\n`;
    });
    
    // Try to find reviews in different collections
    const reviewsCollection = mongoose.connection.db.collection('Reviews');
    const reviewsFromReviews = await reviewsCollection.find({}).toArray();
    
    const reviewsCollectionLower = mongoose.connection.db.collection('reviews');
    const reviewsFromLower = await reviewsCollectionLower.find({}).toArray();
    
    debugInfo += `\nReviews from 'Reviews' collection: ${reviewsFromReviews.length}\n`;
    debugInfo += `Reviews from 'reviews' collection: ${reviewsFromLower.length}\n`;
    
    // Show actual reviews
    const allReviews = [...reviewsFromReviews, ...reviewsFromLower];
    debugInfo += '\nActual reviews found:\n';
    allReviews.forEach(review => {
      debugInfo += `- ${review.userName}: itemId=${review.itemId}, rating=${review.rating}\n`;
    });
    
    const items = await Item.find();
    const itemsWithRatings = items.filter(item => item.reviewCount > 0);
    debugInfo += '\nItems with ratings:\n';
    itemsWithRatings.forEach(item => {
      debugInfo += `- "${item.Title}" (_id: ${item._id}): ${item.reviewCount} reviews\n`;
    });
    
    res.send(debugInfo.replace(/\n/g, '<br>'));
  } catch (error) {
    console.error('❌ Error fixing review IDs:', error);
    res.status(500).send("Failed to fix review IDs.");
  }
});

// Helper function to update item rating
async function updateItemRating(itemId) {
  const reviews = await Review.find({ itemId });
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
    : 0;
  
  await Item.findByIdAndUpdate(itemId, {
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount
  });
}

// Add/Update review
app.post('/api/reviews', async (req, res) => {
  try {
    const { itemId, userEmail, userName, rating, comment } = req.body;
    
    // Check if user already reviewed this item
    const existingReview = await Review.findOne({ itemId, userEmail });
    
    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment;
      await existingReview.save();
    } else {
      // Create new review
      const review = new Review({ itemId, userEmail, userName, rating, comment });
      await review.save();
      
      // Mark item as reviewed in user's orders
      const item = await Item.findById(itemId);
      if (item) {
        await Order.updateMany(
          { 
            registerEmail: userEmail,
            'items.name': item.Title,
            status: { $in: ['delivered', 'Reservation Over'] }
          },
          { $set: { 'items.$.reviewed': true } }
        );
      }
    }
    
    // Update item's average rating
    await updateItemRating(itemId);
    
    res.status(201).json({ success: true, message: 'Review saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save review', details: error.message });
  }
});

// Get reviews for an item
app.get('/api/reviews/:itemId', async (req, res) => {
  try {
    console.log('🔍 Fetching reviews for itemId:', req.params.itemId);
    const reviews = await Review.find({ itemId: req.params.itemId })
      .sort({ createdAt: -1 })
      .limit(50);
    console.log('🔍 Found reviews:', reviews.length);
    
    // If no reviews found, show what itemIds exist in reviews
    if (reviews.length === 0) {
      const allReviews = await Review.find({}).limit(5);
      console.log('🔍 Sample itemIds in database:', allReviews.map(r => ({ itemId: r.itemId, userName: r.userName })));
    }
    
    res.json(reviews);
  } catch (error) {
    console.error('❌ Review fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get user's review for specific item
app.get('/api/reviews/:itemId/:userEmail', async (req, res) => {
  try {
    const review = await Review.findOne({ 
      itemId: req.params.itemId, 
      userEmail: req.params.userEmail 
    });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user review' });
  }
});

// Check if user can review item (has delivered order with this item)
app.get('/api/can-review/:itemId/:userEmail', async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.json({ canReview: false });
    
    const deliveredOrders = await Order.find({
      registerEmail: req.params.userEmail,
      status: { $in: ['delivered', 'Reservation Over'] },
      'items.name': item.Title
    });
    
    res.json({ canReview: deliveredOrders.length > 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check review permission' });
  }
});

// Delete review
app.delete('/api/reviews/:itemId/:userEmail', async (req, res) => {
  try {
    await Review.findOneAndDelete({ 
      itemId: req.params.itemId, 
      userEmail: req.params.userEmail 
    });
    
    // Update item's average rating
    await updateItemRating(req.params.itemId);
    
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});



app.use(adminRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});