const axios = require('axios');
const { investigatePurchaseRecommendation } = require('./investigate');
const { investigateSupplierShortfall } = require('./investigateShortfall');
const { decide, decideShortfall } = require('./decide');
const { act, actOnShortfall } = require('./act');
const { validate, validateShortfall } = require('./validate');
const DecisionLog = require('../models/DecisionLog');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const MAX_RETRIES = parseInt(process.env.MAX_DECIDE_RETRIES || '2', 10);

/**
 * Scenario 1: Purchase Recommendation Review.
 */
async function runPurchaseRecommendationFlow(productId, recommendedQty) {
  let evidence = await investigatePurchaseRecommendation(productId, recommendedQty);
  let retries = 0;
  let decision, actionResult, validationResult;

  while (true) {
    decision = await decide(evidence);
    actionResult = await act(decision, evidence);
    validationResult = await validate(actionResult, evidence);

    if (validationResult.pending) break;
    if (validationResult.valid || !validationResult.requiresRetry) break;

    retries += 1;
    if (retries > MAX_RETRIES) {
      validationResult = {
        ...validationResult,
        escalated: true,
        reason: `${validationResult.reason} Max retries (${MAX_RETRIES}) exceeded — escalating to human.`,
      };
      break;
    }

    evidence = { ...evidence, previousAttemptFailed: true, previousValidationReason: validationResult.reason };
  }

  const finalStatus = validationResult.escalated
    ? 'escalated'
    : validationResult.pending
    ? 'awaiting_approval'
    : validationResult.valid
    ? 'completed'
    : 'failed';

  const log = await DecisionLog.create({
    scenario: 'scenario1_purchase_review',
    triggerInput: { productId, recommendedQty },
    evidenceGathered: evidence,
    decision,
    actionTaken: actionResult.actionTaken,
    validationResult,
    retries,
    finalStatus,
  });

  return { evidence, decision, actionResult, validationResult, retries, finalStatus, logId: log._id };
}

/**
 * Scenario 2: Supplier Cannot Fulfil the Purchase.
 * Simulates the real-world event first (PATCH the PO to reflect the shortfall),
 * then runs the same investigate -> decide -> act -> validate loop shape as Scenario 1.
 */
async function runSupplierShortfallFlow(poId, fulfilledQty) {
  // Step 0: simulate the world event — supplier reports they can only deliver `fulfilledQty`
  await axios.patch(`${BASE_URL}/api/pos/${poId}`, {
    quantityConfirmed: fulfilledQty,
    status: fulfilledQty > 0 ? 'partially_fulfilled' : 'open',
  });

  let evidence = await investigateSupplierShortfall(poId, fulfilledQty);
  let retries = 0;
  let decision, actionResult, validationResult;

  while (true) {
    decision = await decideShortfall(evidence);
    actionResult = await actOnShortfall(decision, evidence);
    validationResult = await validateShortfall(actionResult, evidence);

    if (validationResult.pending) break;
    if (validationResult.valid || !validationResult.requiresRetry) break;

    retries += 1;
    if (retries > MAX_RETRIES) {
      validationResult = {
        ...validationResult,
        escalated: true,
        reason: `${validationResult.reason} Max retries (${MAX_RETRIES}) exceeded — escalating to human.`,
      };
      break;
    }

    evidence = { ...evidence, previousAttemptFailed: true, previousValidationReason: validationResult.reason };
  }

  const finalStatus = validationResult.escalated
    ? 'escalated'
    : validationResult.pending
    ? 'awaiting_approval'
    : validationResult.valid
    ? 'completed'
    : 'failed';

  const log = await DecisionLog.create({
    scenario: 'scenario2_supplier_shortfall',
    triggerInput: { poId, fulfilledQty },
    evidenceGathered: evidence,
    decision,
    actionTaken: actionResult.actionTaken,
    validationResult,
    retries,
    finalStatus,
  });

  return { evidence, decision, actionResult, validationResult, retries, finalStatus, logId: log._id };
}

module.exports = { runPurchaseRecommendationFlow, runSupplierShortfallFlow };