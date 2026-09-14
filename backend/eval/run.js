// Phase 6 evaluation harness entry point.
// Usage: Terminal 1: `npm run dev`   Terminal 2: `npm run eval`

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');

const runner = require('./testRunner');
const unitTests = require('./unit');
const e2eTests = require('./e2e');
const { cleanupEvalFixtures } = require('./fixtures');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

async function isServerUp() {
  try {
    const res = await axios.get(`${BASE_URL}/health`, { timeout: 2000 });
    return res.data && res.data.status === 'ok';
  } catch {
    return false;
  }
}

async function main() {
  console.log('=== AI Purchasing Agent — Evaluation Harness (Phase 6) ===\n');

  console.log('--- Deterministic unit tests (no DB, no LLM) ---');
  await unitTests.run();

  const mongoUri = process.env.MONGODB_URI;
  let dbConnected = false;
  let serverUp = false;

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      dbConnected = true;
    } catch (err) {
      console.log(`\n(!) Could not connect to MongoDB (${err.message}) — skipping end-to-end tests.\n`);
    }
  } else {
    console.log('\n(!) MONGODB_URI not set — skipping end-to-end tests.\n');
  }

  if (dbConnected) {
    serverUp = await isServerUp();
    if (!serverUp) {
      console.log(`(!) Backend not reachable at ${BASE_URL}/health — start it with "npm run dev" in another terminal, then re-run. Skipping end-to-end tests.\n`);
    }
  }

  if (dbConnected && serverUp) {
    console.log('--- End-to-end tests (real DB + real routes + real LLM) ---');
    try {
      await e2eTests.run();
    } finally {
      await cleanupEvalFixtures();
    }
  }

  if (dbConnected) await mongoose.disconnect();

  const { passed, failed, total } = runner.summary();
  console.log(`\n=== ${passed}/${total} passed${failed ? `, ${failed} failed` : ''} ===`);

  const reportPath = path.join(__dirname, 'eval-report.md');
  fs.writeFileSync(reportPath, runner.toMarkdown());
  console.log(`Report written to ${reportPath}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Evaluation harness crashed:', err);
  process.exit(1);
});