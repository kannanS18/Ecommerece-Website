const { MongoClient } = require("mongodb");

async function run() {
  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  console.log("✅ Connected to MongoDB");

  const db = client.db("ecomm");
  const collection = db.collection("Items");

  const cursor = collection.find({});

  const instructionsMap = {
    "Snacks": "Best served hot and crispy with your favorite dips like ketchup or garlic mayo. Ideal for sharing during tea time or as a quick bite. To enjoy the perfect crunch, consume within 20 minutes of preparation. Reheating may affect texture and taste.",
    "Desserts": "Keep refrigerated and serve chilled or slightly tempered to room temperature. Consume within 2 hours for the best flavor and freshness. Perfect after-meal treat that satisfies sweet cravings. Avoid prolonged exposure to heat or sunlight.",
    "Baked Goods": "Store in a cool, dry place to maintain softness and flavor. Best enjoyed within 24 hours of baking, with a warm-up for added freshness. Suitable for breakfast, snacks, or alongside beverages like coffee or tea. Avoid refrigeration unless instructed.",
    "Salads": "Serve well-chilled for maximum freshness and crunch. Stir or toss the ingredients thoroughly before serving to evenly coat. Add dressing right before eating to avoid sogginess. Great as a healthy side or light standalone meal.",
    "Main Course": "Serve hot along with rice, bread, or your preferred sides for a complete meal. Reheat gently before serving if needed, ensuring it’s evenly warmed. Best consumed fresh to enjoy full flavor and texture. Store leftovers in the fridge and use within a day."
  };

  const generateNutrition = (category) => {
    switch (category) {
      case "Snacks":
        return { protein: random(2, 6), calories: random(150, 300), fat: random(10, 20), fiber: random(1, 3) };
      case "Desserts":
        return { protein: random(1, 4), calories: random(200, 500), fat: random(10, 25), fiber: random(0, 2) };
      case "Baked Goods":
        return { protein: random(3, 7), calories: random(180, 350), fat: random(6, 14), fiber: random(1, 3) };
      case "Salads":
        return { protein: random(2, 6), calories: random(100, 200), fat: random(3, 10), fiber: random(2, 5) };
      default:
        return { protein: random(6, 15), calories: random(250, 600), fat: random(8, 20), fiber: random(2, 5) };
    }
  };

  function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  for await (const doc of cursor) {
    const category = doc.category;
    if (!category) {
      console.warn(`⚠️ Skipping '${doc.Title}' because no category found`);
      continue;
    }

    const instructions = instructionsMap[category] || "Enjoy your meal!";
    const nutrition = generateNutrition(category);

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          instructions,
          nutrition
        }
      }
    );

    console.log(`✅ Updated '${doc.Title}' with nutrition & instructions (category: ${category})`);
  }

  await client.close();
  console.log("✅ Done!");
}

// ✅ Export so you can call it from server.js
module.exports = run;
