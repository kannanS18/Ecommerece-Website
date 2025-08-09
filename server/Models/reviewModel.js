const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  itemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Item', 
    required: true 
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    maxlength: 500 
  }
}, { 
  timestamps: true,
  collection: 'Reviews' 
});

// Ensure one review per user per item
reviewSchema.index({ itemId: 1, userEmail: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);