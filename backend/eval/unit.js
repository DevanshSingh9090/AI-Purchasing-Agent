// Deterministic tests for the parts of the agent that do NOT depend on the LLM or the DB:
// decide.js's guardrails, and act.js's human-approval gating. No network, no LLM call.
// Note: assumes the default LOW_CONFIDENCE_THRESHOLD (0.6), i.e. no override in .env.

const { applyGuardrails, applyShortfallGuardrails } = require('../src/agent/decide');
const { requiresHumanApproval, requiresShortfallApproval } = require('../src/agent/act');
const { test, assert } = require('./testRunner');

function baseEvidence() {
  return {
    recommendedQty: 800,
    estimatedCost: 8000,
    chosenSupplier: { minimumOrderQty: 100 },
    budget: { remainingBudget: 5000 },
    storage: { estimatedStorageNeeded: 400, remainingStorage: 1000 },
  };
}

function baseShortfallEvidence() {
  return {
    shortfallQty: 250,
    originalSupplier: { _id: 'sup-original', minimumOrderQty: 100 },
    alternateSuppliers: [{ _id: 'sup-alt', minimumOrderQty: 50 }],
    bestAlternate: { _id: 'sup-alt', minimumOrderQty: 50 },
    estimatedCostPerUnit: 10,
    estimatedStoragePerUnit: 0.5,
    budget: { remainingBudget: 5000 },
    storage: { remainingStorage: 1000 },
  };
}

async function run() {
  await test('Guardrail: modify quantity below supplier MOQ is forced to investigate', () => {
    const decision = { decision: 'modify', modified_quantity: 50, confidence: 0.9, reasons: [], missingInformation: [] };
    const result = applyGuardrails(decision, baseEvidence());
    assert(result.decision === 'investigate', `expected 'investigate', got '${result.decision}'`, { result });
    assert(result.reasons.some(r => /MOQ/i.test(r)), 'expected a reason mentioning MOQ', { result });
  });

  await test('Guardrail: modify quantity exceeding remaining budget is forced to investigate', () => {
    const decision = { decision: 'modify', modified_quantity: 700, confidence: 0.9, reasons: [], missingInformation: [] };
    const result = applyGuardrails(decision, baseEvidence());
    assert(result.decision === 'investigate', `expected 'investigate', got '${result.decision}'`, { result });
    assert(result.reasons.some(r => /budget/i.test(r)), 'expected a reason mentioning budget', { result });
  });

  await test('Guardrail: modify quantity exceeding remaining storage is forced to investigate', () => {
    const decision = { decision: 'modify', modified_quantity: 300, confidence: 0.9, reasons: [], missingInformation: [] };
    const evidence = baseEvidence();
    evidence.storage.remainingStorage = 100;
    const result = applyGuardrails(decision, evidence);
    assert(result.decision === 'investigate', `expected 'investigate', got '${result.decision}'`, { result });
    assert(result.reasons.some(r => /storage/i.test(r)), 'expected a reason mentioning storage', { result });
  });

  await test('Guardrail: a modify quantity within MOQ/budget/storage is left untouched', () => {
    const decision = { decision: 'modify', modified_quantity: 300, confidence: 0.85, reasons: ['fits available budget'], missingInformation: [] };
    const result = applyGuardrails(decision, baseEvidence());
    assert(result.decision === 'modify', `expected guardrails to leave a valid modify alone, got '${result.decision}'`, { result });
  });

  await test('Shortfall guardrail: quantity below chosen supplier MOQ is escalated', () => {
    const decision = { decision: 'alternate_supplier', additional_quantity: 20, chosen_supplier_id: 'sup-alt', confidence: 0.9, reasons: [], missingInformation: [] };
    const result = applyShortfallGuardrails(decision, baseShortfallEvidence());
    assert(result.decision === 'escalate', `expected 'escalate', got '${result.decision}'`, { result });
    assert(result.reasons.some(r => /MOQ/i.test(r)), 'expected a reason mentioning MOQ', { result });
  });

  await test('Shortfall guardrail: no resolvable supplier id is escalated', () => {
    const decision = { decision: 'alternate_supplier', additional_quantity: 100, chosen_supplier_id: 'sup-does-not-exist', confidence: 0.9, reasons: [], missingInformation: [] };
    const result = applyShortfallGuardrails(decision, baseShortfallEvidence());
    assert(result.decision === 'escalate', `expected 'escalate', got '${result.decision}'`, { result });
  });

  await test('Approval gate: low-confidence decisions always require human approval, even "accept"', () => {
    const decision = { decision: 'accept', confidence: 0.4 };
    assert(requiresHumanApproval(decision) === true, 'expected requiresHumanApproval to be true for confidence 0.4', { decision });
  });

  await test('Approval gate: high-confidence "accept" auto-executes, but "modify"/"reject" always need approval', () => {
    assert(requiresHumanApproval({ decision: 'accept', confidence: 0.95 }) === false, 'expected high-confidence accept to NOT require approval');
    assert(requiresHumanApproval({ decision: 'modify', confidence: 0.95 }) === true, 'expected modify to always require approval regardless of confidence');
    assert(requiresHumanApproval({ decision: 'reject', confidence: 0.95 }) === true, 'expected reject to always require approval regardless of confidence');
  });

  await test('Shortfall approval gate: switching suppliers always requires human approval', () => {
    assert(requiresShortfallApproval({ decision: 'alternate_supplier', confidence: 0.95 }) === true, 'expected alternate_supplier to require approval');
    assert(requiresShortfallApproval({ decision: 'source_elsewhere', confidence: 0.95 }) === true, 'expected source_elsewhere to require approval');
    assert(requiresShortfallApproval({ decision: 'raise_additional_po', confidence: 0.95 }) === false, 'expected raise_additional_po with high confidence to NOT require approval');
  });
}

module.exports = { run };