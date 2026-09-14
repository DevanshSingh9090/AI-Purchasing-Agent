// Integration tests through the real orchestrator, DB, routes, and LLM. Assert on
// INVARIANTS (evidence completeness, valid decision shape, constraints never silently
// violated) rather than pinning an exact LLM decision string.

const axios = require('axios');
const { runPurchaseRecommendationFlow, runSupplierShortfallFlow } = require('../src/agent/orchestrator');
const { withTightBudget, withTightStorage, createProductFixture, createShortfallPOFixture } = require('./fixtures');
const { test, assert } = require('./testRunner');
const { LOW_CONFIDENCE_THRESHOLD } = require('../src/agent/act');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const VALID_S1_DECISIONS = ['accept', 'modify', 'reject', 'investigate'];
const VALID_S2_DECISIONS = ['source_elsewhere', 'alternate_supplier', 'raise_additional_po', 'rely_on_inventory', 'escalate'];
const VALID_FINAL_STATUSES = ['completed', 'escalated', 'failed', 'awaiting_approval'];

function assertEvidenceComplete(evidence) {
  for (const key of ['inventory', 'demandForecast', 'openPOs', 'suppliers', 'chosenSupplier', 'budget', 'storage', 'existingSupplyVsDemand']) {
    assert(evidence[key] !== undefined, `evidence is missing '${key}'`, { evidence });
  }
}

function assertConstraintsRespected(result, evidence) {
  const { actionResult, finalStatus } = result;
  if (!actionResult.actionTaken || actionResult.actionTaken.type !== 'create_po') return;

  const qty = actionResult.actionTaken.po ? actionResult.actionTaken.po.quantityOrdered : actionResult.actionTaken.quantity;
  if (qty == null) return;

  const unitCost = evidence.estimatedCost / evidence.recommendedQty;
  const storagePerUnit = evidence.storage.estimatedStorageNeeded / evidence.recommendedQty;
  const cost = qty * unitCost;
  const storageNeeded = qty * storagePerUnit;

  const overBudget = cost > evidence.budget.remainingBudget;
  const overStorage = storageNeeded > evidence.storage.remainingStorage;

  if (overBudget || overStorage) {
    assert(
      actionResult.needsApproval || finalStatus === 'escalated' || finalStatus === 'failed',
      `a PO exceeding budget/storage reached finalStatus '${finalStatus}' without approval gating or escalation`,
      { qty, cost, storageNeeded, remainingBudget: evidence.budget.remainingBudget, remainingStorage: evidence.storage.remainingStorage, result }
    );
  }
}

async function run() {
  await test('Health check: backend server is reachable', async () => {
    const res = await axios.get(`${BASE_URL}/health`);
    assert(res.data.status === 'ok', 'expected /health to report status ok', { response: res.data });
  });

  await test('Scenario 1 — baseline recommendation review runs the full loop and logs a decision', async () => {
    const { product, supplier } = await createProductFixture({
      skuSuffix: 'baseline', unitCost: 10, storageUnitsPerItem: 1, availableQty: 50, reservedQty: 0,
      expectedDemand: 300, leadTimeDays: 10, minimumOrderQty: 50,
    });

    const result = await runPurchaseRecommendationFlow(product._id.toString(), 250);

    assertEvidenceComplete(result.evidence);
    assert(VALID_S1_DECISIONS.includes(result.decision.decision), `unexpected decision type '${result.decision.decision}'`, { result });
    assert(Array.isArray(result.decision.reasons) && result.decision.reasons.length > 0, 'expected at least one reason for the decision', { decision: result.decision });
    assert(VALID_FINAL_STATUSES.includes(result.finalStatus), `unexpected finalStatus '${result.finalStatus}'`, { result });
    assert(result.logId, 'expected a DecisionLog document to have been created', { result });
    assertConstraintsRespected(result, result.evidence);

    return { productId: product._id.toString(), supplierId: supplier._id.toString(), decision: result.decision.decision, finalStatus: result.finalStatus, retries: result.retries };
  });

  await sleep(2000);

  await test('Scenario 1 — tight budget: a purchase that would blow the budget is never silently approved', async () => {
    const { product } = await createProductFixture({
      skuSuffix: 'tight-budget', unitCost: 50, storageUnitsPerItem: 1, availableQty: 10, reservedQty: 0,
      expectedDemand: 900, leadTimeDays: 10, minimumOrderQty: 100,
    });

    const result = await withTightBudget({ totalBudget: 1000, spentSoFar: 800 }, () =>
      runPurchaseRecommendationFlow(product._id.toString(), 800)
    );

    assertEvidenceComplete(result.evidence);
    assert(VALID_S1_DECISIONS.includes(result.decision.decision), `unexpected decision type '${result.decision.decision}'`, { result });
    assertConstraintsRespected(result, result.evidence);

    return { decision: result.decision.decision, finalStatus: result.finalStatus, remainingBudget: result.evidence.budget.remainingBudget, retries: result.retries };
  });

  await sleep(2000);

  await test('Scenario 1 — tight storage: a purchase that would overflow the warehouse is never silently approved', async () => {
    const { product } = await createProductFixture({
      skuSuffix: 'tight-storage', unitCost: 5, storageUnitsPerItem: 3, availableQty: 10, reservedQty: 0,
      expectedDemand: 900, leadTimeDays: 10, minimumOrderQty: 100,
    });

    const result = await withTightStorage({ totalCapacity: 1000, usedCapacity: 980 }, () =>
      runPurchaseRecommendationFlow(product._id.toString(), 800)
    );

    assertEvidenceComplete(result.evidence);
    assert(VALID_S1_DECISIONS.includes(result.decision.decision), `unexpected decision type '${result.decision.decision}'`, { result });
    assertConstraintsRespected(result, result.evidence);

    return { decision: result.decision.decision, finalStatus: result.finalStatus, remainingStorage: result.evidence.storage.remainingStorage, retries: result.retries };
  });

  await sleep(2000);

  await test('Scenario 2 — supplier shortfall runs the full loop with correct shortfall math', async () => {
    const { po } = await createShortfallPOFixture({
      skuSuffix: 'shortfall', quantityOrdered: 500, leadTimeDays: 14, minimumOrderQty: 100, unitCost: 12,
      altSupplierLeadTimeDays: 7, altSupplierMOQ: 50,
    });

    const fulfilledQty = 250;
    const result = await runSupplierShortfallFlow(po._id.toString(), fulfilledQty);

    assert(result.evidence.shortfallQty === 500 - fulfilledQty, `expected shortfallQty ${500 - fulfilledQty}, got ${result.evidence.shortfallQty}`, { evidence: result.evidence });
    assert(VALID_S2_DECISIONS.includes(result.decision.decision), `unexpected decision type '${result.decision.decision}'`, { result });
    assert(VALID_FINAL_STATUSES.includes(result.finalStatus), `unexpected finalStatus '${result.finalStatus}'`, { result });
    assert(result.logId, 'expected a DecisionLog document to have been created', { result });

    return { poId: po._id.toString(), decision: result.decision.decision, finalStatus: result.finalStatus, shortfallQty: result.evidence.shortfallQty };
  });

  await sleep(2000);

  await test('Scenario 1 — retry-then-escalate: a self-correcting loop never reports "completed" on a bad purchase', async () => {
    const { product } = await createProductFixture({
      skuSuffix: 'retry-escalate', unitCost: 100, storageUnitsPerItem: 1, availableQty: 5, reservedQty: 0,
      expectedDemand: 2000, leadTimeDays: 10, minimumOrderQty: 100,
    });

    const result = await withTightBudget({ totalBudget: 500, spentSoFar: 450 }, () =>
      runPurchaseRecommendationFlow(product._id.toString(), 1500)
    );

    assert(
      result.finalStatus !== 'completed' || !result.actionResult.actionTaken,
      `expected the loop to never mark an impossible-to-afford purchase as 'completed'`,
      { result }
    );

    if (result.actionResult.status === 'executed') {
      assert(
        result.finalStatus === 'escalated' || result.finalStatus === 'failed',
        `expected escalation after repeated validation failures, got finalStatus '${result.finalStatus}'`,
        { result }
      );
      assert(result.retries > 0, 'expected at least one retry before giving up', { result });
    }

    return { decision: result.decision.decision, finalStatus: result.finalStatus, retries: result.retries, actionStatus: result.actionResult.status };
  });

  await sleep(2000);

  await test('Scenario 1 — low confidence: an uncertain decision never silently auto-executes', async () => {
    // Deliberately conflicting/ambiguous evidence: demand sits almost exactly on the
    // boundary of what budget and storage can support, with a high-MOQ supplier —
    // designed to make the LLM genuinely unsure rather than confidently right or wrong.
    const { product } = await createProductFixture({
      skuSuffix: 'low-confidence',
      unitCost: 20,
      storageUnitsPerItem: 2,
      availableQty: 15,
      reservedQty: 5,
      expectedDemand: 410, // close to available+PO-less supply, ambiguous whether a buy is even needed
      leadTimeDays: 25,     // long lead time adds urgency pressure
      minimumOrderQty: 380, // MOQ sits right at the edge of what's affordable
    });

    const result = await withTightBudget({ totalBudget: 8000, spentSoFar: 100 }, () =>
      runPurchaseRecommendationFlow(product._id.toString(), 400)
    );

    assertEvidenceComplete(result.evidence);
    assert(VALID_S1_DECISIONS.includes(result.decision.decision), `unexpected decision type '${result.decision.decision}'`, { result });

    // The core invariant: regardless of what Gemini actually decided, if confidence
    // came back below the threshold, the system must NEVER have silently executed a PO.
    if (result.decision.confidence < LOW_CONFIDENCE_THRESHOLD) {
      assert(
        result.actionResult.status !== 'executed',
        `expected a low-confidence decision (confidence=${result.decision.confidence}) to require approval, but it auto-executed`,
        { result }
      );
      assert(
        result.actionResult.needsApproval === true || result.actionResult.status === 'no_action_needed_investigate',
        `expected needsApproval=true or an 'investigate' outcome for a low-confidence decision`,
        { result }
      );
    }

    return {
      productId: product._id.toString(),
      decision: result.decision.decision,
      confidence: result.decision.confidence,
      actionStatus: result.actionResult.status,
      finalStatus: result.finalStatus,
    };
  });
}

module.exports = { run };