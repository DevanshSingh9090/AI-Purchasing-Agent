require('dotenv').config();
const { investigatePurchaseRecommendation } = require('./investigate');
const { decide } = require('./decide');
const { act } = require('./act');

async function run() {
  const productId = process.argv[2];
  const evidence = await investigatePurchaseRecommendation(productId, 800);
  const decision = await decide(evidence);
  console.log('--- DECISION ---', decision);

  const actionResult = await act(decision, evidence);
  console.log('--- ACTION ---', actionResult);
}

run().catch(err => console.error(err));