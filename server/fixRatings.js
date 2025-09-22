const mongoose = require('mongoose');
const Item = require('./Models/itemModel');
const Review = require('./Models/reviewModel');
require('dotenv').config();

async function fixRatings() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecomm');
    console.log('✅ Connected to MongoDB');

    const items = await Item.find();
    console.log(`Found ${items.length} items`);

    for (const item of items) {
      const reviews = await Review.find({ itemId: item._id });
      const reviewCount = reviews.length;
      const averageRating = reviewCount > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
        : 0;

      await Item.findByIdAndUpdate(item._id, {
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount
      });

      console.log(`Updated ${item.Title}: ${reviewCount} reviews, avg: ${averageRating.toFixed(1)}`);
    }

    console.log('✅ Fixed all ratings');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixRatings();