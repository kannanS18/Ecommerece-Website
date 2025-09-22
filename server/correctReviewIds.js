const mongoose = require('mongoose');
const Item = require('./Models/itemModel');
const Review = require('./Models/reviewModel');
require('dotenv').config();

async function correctReviewIds() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecomm');
    console.log('✅ Connected to MongoDB');

    const items = await Item.find();
    const reviews = await Review.find();
    
    console.log(`Found ${items.length} items and ${reviews.length} reviews`);
    
    // Show items with ratings
    console.log('\nItems with ratings:');
    items.forEach(item => {
      if (item.reviewCount > 0) {
        console.log(`- "${item.Title}" (_id: ${item._id}): ${item.reviewCount} reviews, avg: ${item.averageRating}`);
      }
    });
    
    // Show current reviews
    console.log('\nCurrent reviews:');
    reviews.forEach(review => {
      console.log(`- ${review.userName}: itemId=${review.itemId}, rating=${review.rating}`);
    });

    // Map reviews to correct items based on the order
    const itemsWithRatings = items.filter(item => item.reviewCount > 0);
    
    for (let i = 0; i < itemsWithRatings.length && i < reviews.length; i++) {
      const item = itemsWithRatings[i];
      const review = reviews[i];
      
      if (review.itemId.toString() !== item._id.toString()) {
        console.log(`\n🔧 Updating review by ${review.userName}`);
        console.log(`   From itemId: ${review.itemId}`);
        console.log(`   To itemId: ${item._id} (${item.Title})`);
        
        await Review.findByIdAndUpdate(review._id, { itemId: item._id });
      }
    }

    console.log('\n✅ Review itemId correction completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

correctReviewIds();