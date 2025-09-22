const mongoose = require('mongoose');
const Item = require('./Models/itemModel');
const Review = require('./Models/reviewModel');
require('dotenv').config();

async function fixReviewItemIds() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecomm');
    console.log('✅ Connected to MongoDB');

    // Get all items and reviews
    const items = await Item.find();
    const reviews = await Review.find();
    
    console.log(`Found ${items.length} items and ${reviews.length} reviews`);
    console.log('\nItems with ratings:');
    items.forEach(item => {
      if (item.reviewCount > 0) {
        console.log(`- "${item.Title}" (${item._id}): ${item.reviewCount} reviews, avg: ${item.averageRating}`);
      }
    });
    
    console.log('\nExisting reviews:');
    reviews.forEach(review => {
      console.log(`- Review by ${review.userName}: itemId=${review.itemId}, rating=${review.rating}`);
    });

    // Find items that have ratings but reviews with wrong itemId
    for (const item of items) {
      if (item.reviewCount > 0) {
        const correctReviews = reviews.filter(r => r.itemId.toString() === item._id.toString());
        
        if (correctReviews.length === 0) {
          console.log(`\n🔧 Fixing reviews for "${item.Title}" (${item._id})`);
          
          // Find reviews that should belong to this item
          // Since we know the reviews exist but have wrong itemId, let's update them
          const reviewsToUpdate = reviews.slice(0, item.reviewCount);
          
          for (let i = 0; i < reviewsToUpdate.length; i++) {
            const review = reviewsToUpdate[i];
            console.log(`   Updating review ${review._id} from itemId ${review.itemId} to ${item._id}`);
            await Review.findByIdAndUpdate(review._id, { itemId: item._id });
          }
        }
      }
    }

    console.log('\n✅ Review itemId fix completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixReviewItemIds();