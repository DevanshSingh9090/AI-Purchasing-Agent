require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const { runPurchaseRecommendationFlow } = require('./orchestrator');

  const productId = process.argv[2];
  const result = await runPurchaseRecommendationFlow(productId, 800);

  console.log(JSON.stringify(result, null, 2));
  await mongoose.disconnect();
}

run().catch(err => console.error(err));