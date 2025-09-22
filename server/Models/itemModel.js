const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  Title: { type: String, required: true },
  Ingredients: { type: String, required: true }, // stored as stringified array in your DB
  Instructions: { type: String, required: true },
  Image_Name: { type: String }, // image file name (e.g., "croissant.jpg")
  Cleaned_Ingredients: { type: String }, // stored as stringified array in your DB
  category: { type: String },
  price: { type: Number },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 }
}, { collection: 'items' });

module.exports = mongoose.model('Item', itemSchema);