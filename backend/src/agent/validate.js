const axios = require('axios');
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

/**
 * Re-checks the ACTUAL resulting state after an action was executed.
 * This is distinct from decide.js's pre-action guardrails — those check
 * the proposed decision; this checks reality after the fact.
 */
async function validate(actionResult, evidence) {
  if (actionResult.status === 'no_action_needed_investigate') {
    return { valid: true, reason: 'No action was taken; nothing to validate.', requiresRetry: false };
  }

  if (actionResult.status === 'pending_human_approval') {
    return {
      valid: null, // not yet determinable
      reason: 'Action is awaiting human approval; validation deferred until executed.',
      requiresRetry: false,
      pending: true,
    };
  }

  if (actionResult.status === 'rejected_no_action') {
    return { valid: true, reason: 'Decision was reject; no PO created, nothing to validate.', requiresRetry: false };
  }

  // status === 'executed' -> a PO was actually created. Re-check real state.
  const [budgetRes, storageRes] = await Promise.all([
    axios.get(`${BASE_URL}/api/budget`),
    axios.get(`${BASE_URL}/api/storage`),
  ]);

  const budget = budgetRes.data;
  const storage = storageRes.data;

  const po = actionResult.actionTaken.po;
  const productUnitCost = evidence.estimatedCost / evidence.recommendedQty;
  const actualCost = po.quantityOrdered * productUnitCost;
  const newSpent = budget.spentSoFar; // in a real system this would already reflect the PO; here we simulate the check
  const wouldExceedBudget = (newSpent + actualCost) > budget.totalBudget;

  const remainingStorageAfter = storage.totalCapacity - storage.usedCapacity;
  const storageNeeded = po.quantityOrdered * (evidence.storage.estimatedStorageNeeded / evidence.recommendedQty);
  const wouldExceedStorage = storageNeeded > remainingStorageAfter;

  if (wouldExceedBudget || wouldExceedStorage) {
    return {
      valid: false,
      reason: wouldExceedBudget
        ? `Post-action check failed: actual cost ${actualCost} would exceed remaining budget.`
        : `Post-action check failed: required storage ${storageNeeded} exceeds remaining capacity ${remainingStorageAfter}.`,
      requiresRetry: true,
    };
  }

  return {
    valid: true,
    reason: 'Post-action state confirmed within budget and storage constraints.',
    requiresRetry: false,
  };
}

/**
 * Simulates a "world changed" event for Scenario 2-style testing:
 * a supplier can only fulfill part of what was ordered.
 */
function simulateSupplierShortfall(po, fulfilledQty) {
  return {
    ...po,
    quantityConfirmed: fulfilledQty,
    status: fulfilledQty < po.quantityOrdered ? 'partially_fulfilled' : 'fulfilled',
  };
}

module.exports = { validate, simulateSupplierShortfall };