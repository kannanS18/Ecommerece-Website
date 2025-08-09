const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  registerEmail: String,
  registerName: String,
  address: String,
  phone: String,
  items: [{
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    reviewed: { type: Boolean, default: false }
  }],
  total: Number,
  msg: String,
  isFinalised: { type: Boolean, default: false },
  status: { type: String, default: 'pending' }, // "ordered", "out for delivery"
  type: { type: String, enum: ['take away', 'dine in'], default: 'dine in' },
  dineInDate: { type: String },
dineInTime: { type: String },
  estimatedTime: { type: Date },
gst: { type: Number, default: 0 },
finalTotal: { type: Number, default: 0 },

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);