const mongoose = require('mongoose');
const Item = require('./Models/itemModel');
const Review = require('./Models/reviewModel');
require('dotenv').config();

async function fixItemIds() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecomm');
    console.log('✅ Connected to MongoDB');

    // Get all reviews with their itemIds
    const reviews = await Review.find({});
    console.log(`Found ${reviews.length} reviews`);

    // Get all items
    const items = await Item.find({});
    console.log(`Found ${items.length} items`);

    // Show the mismatch
    for (const review of reviews) {
      const item = await Item.findById(review.itemId);
      if (!item) {
        console.log(`❌ Review itemId ${review.itemId} doesn't match any item`);
        
        // Try to find item by title or other means
        const possibleItem = items.find(i => 
          i.Title.toLowerCase().includes('crispy') || 
          i.Title.toLowerCase().includes('salt') ||
          i.Title.toLowerCase().includes('pepper')
        );
        
        if (possibleItem) {
          console.log(`🔄 Found possible match: ${possibleItem.Title} (${possibleItem._id})`);
          console.log(`   Review was for itemId: ${review.itemId}`);
          console.log(`   Should update review itemId to: ${possibleItem._id}`);
        }
      } else {
        console.log(`✅ Review for ${item.Title} matches correctly`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixItemIds();