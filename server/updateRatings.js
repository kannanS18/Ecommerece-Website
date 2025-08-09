const { MongoClient } = require("mongodb");

async function updateItemsWithRatings() {
  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  console.log("✅ Connected to MongoDB");

  const db = client.db("ecomm");
  const collection = db.collection("Items");

  // Update all items that don't have rating fields
  const result = await collection.updateMany(
    {
      $or: [
        { averageRating: { $exists: false } },
        { reviewCount: { $exists: false } }
      ]
    },
    {
      $set: {
        averageRating: 0,
        reviewCount: 0
      }
    }
  );

  console.log(`✅ Updated ${result.modifiedCount} items with default rating values`);

  await client.close();
  console.log("✅ Done!");
}

// Run the update
updateItemsWithRatings().catch(console.error);

module.exports = updateItemsWithRatings;