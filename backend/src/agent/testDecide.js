require('dotenv').config();
const mongoose = require('mongoose');
const { investigatePurchaseRecommendation } = require('./investigate');
const { decide } = require('./decide');

async function run() {
  const productId = process.argv[2]; // pass mouse's _id as CLI arg
  const recommendedQty = 800;

  const evidence = await investigatePurchaseRecommendation(productId, recommendedQty);
  console.log('--- EVIDENCE ---');
  console.log(JSON.stringify(evidence, null, 2));

  const decision = await decide(evidence);
  console.log('--- DECISION ---');
  console.log(JSON.stringify(decision, null, 2));
}

run().catch(err => console.error(err));