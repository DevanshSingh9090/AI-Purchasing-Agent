require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const { runSupplierShortfallFlow } = require('./orchestrator');

  const poId = process.argv[2];
  const fulfilledQty = parseInt(process.argv[3], 10);

  const result = await runSupplierShortfallFlow(poId, fulfilledQty);
  console.log(JSON.stringify(result, null, 2));

  await mongoose.disconnect();
}

run().catch(err => console.error(err));