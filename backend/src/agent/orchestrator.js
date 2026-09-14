const { investigatePurchaseRecommendation } = require('./investigate');
const { decide } = require('./decide');
const { act } = require('./act');
const { validate } = require('./validate');
const DecisionLog = require('../models/DecisionLog');

const MAX_RETRIES = parseInt(process.env.MAX_DECIDE_RETRIES || '2', 10);

/**
 * Runs the full investigate -> decide -> act -> validate loop for Scenario 1.
 * If validation fails, re-enters decide with augmented evidence, up to MAX_RETRIES,
 * then escalates to a human.
 */
async function runPurchaseRecommendationFlow(productId, recommendedQty) {
  let evidence = await investigatePurchaseRecommendation(productId, recommendedQty);
  let retries = 0;
  let decision, actionResult, validationResult;

  while (true) {
    decision = await decide(evidence);
    actionResult = await act(decision, evidence);
    validationResult = await validate(actionResult, evidence);

    if (validationResult.pending) {
      // Awaiting human approval — loop ends here, not a failure
      break;
    }

    if (validationResult.valid || !validationResult.requiresRetry) {
      break;
    }

    // Validation failed and retry is warranted
    retries += 1;
    if (retries > MAX_RETRIES) {
      validationResult = {
        ...validationResult,
        escalated: true,
        reason: `${validationResult.reason} Max retries (${MAX_RETRIES}) exceeded — escalating to human.`,
      };
      break;
    }

    // Feed the failure back into evidence so decide has new context on the next loop
    evidence = {
      ...evidence,
      previousAttemptFailed: true,
      previousValidationReason: validationResult.reason,
    };
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

module.exports = { runPurchaseRecommendationFlow };