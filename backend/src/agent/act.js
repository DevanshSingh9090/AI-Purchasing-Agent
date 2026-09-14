const axios = require('axios');
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

const LOW_CONFIDENCE_THRESHOLD = parseFloat(process.env.LOW_CONFIDENCE_THRESHOLD || '0.6');

function requiresHumanApproval(decision) {
  if (decision.decision === 'modify' || decision.decision === 'reject') return true;
  if (decision.confidence < LOW_CONFIDENCE_THRESHOLD) return true;
  return false;
}

async function act(decision, evidence) {
  const needsApproval = requiresHumanApproval(decision);

  if (decision.decision === 'investigate') {
    return {
      actionTaken: null,
      status: 'no_action_needed_investigate',
      needsApproval: false,
    };
  }

  if (decision.decision === 'reject') {
    return {
      actionTaken: null,
      status: needsApproval ? 'pending_human_approval' : 'rejected_no_action',
      needsApproval,
    };
  }

  const quantity = decision.decision === 'modify' ? decision.modified_quantity : evidence.recommendedQty;

  if (needsApproval) {
    return {
      actionTaken: {
        type: 'create_po',
        productId: evidence.productId,
        supplierId: evidence.chosenSupplier._id,
        quantity,
      },
      status: 'pending_human_approval',
      needsApproval: true,
    };
  }

  const poRes = await axios.post(`${BASE_URL}/api/pos`, {
    productId: evidence.productId,
    supplierId: evidence.chosenSupplier._id,
    quantityOrdered: quantity,
    quantityConfirmed: quantity,
    status: 'open',
    expectedDelivery: new Date(Date.now() + evidence.chosenSupplier.leadTimeDays * 24 * 60 * 60 * 1000),
  });

  return {
    actionTaken: {
      type: 'create_po',
      po: poRes.data,
    },
    status: 'executed',
    needsApproval: false,
  };
}

module.exports = { act, requiresHumanApproval };