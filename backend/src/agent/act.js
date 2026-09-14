const axios = require('axios');
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

const LOW_CONFIDENCE_THRESHOLD = parseFloat(process.env.LOW_CONFIDENCE_THRESHOLD || '0.6');

function normalizeDecision(value) {
  return String(value || '').trim().toLowerCase();
}

function requiresHumanApproval(decision) {
  const action = normalizeDecision(decision.decision);

  // Any modification or rejection must always be reviewed by a human.
  if (action === 'modify' || action === 'reject') return true;

  // Low-confidence decisions also require review.
  if (Number(decision.confidence) < LOW_CONFIDENCE_THRESHOLD) return true;

  return false;
}

async function act(decision, evidence) {
  const action = normalizeDecision(decision.decision);
  const needsApproval = requiresHumanApproval(decision);

  if (action === 'investigate') {
    return {
      actionTaken: null,
      status: 'no_action_needed_investigate',
      needsApproval: false,
    };
  }

  if (action === 'reject') {
    return {
      actionTaken: null,
      status: needsApproval ? 'pending_human_approval' : 'rejected_no_action',
      needsApproval,
    };
  }

  const quantity =
    action === 'modify'
      ? Number(decision.modified_quantity)
      : Number(evidence.recommendedQty);

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

function requiresShortfallApproval(decision) {
  const action = normalizeDecision(decision.decision);

  if (action === 'escalate') return true;
  if (Number(decision.confidence) < LOW_CONFIDENCE_THRESHOLD) return true;

  // Switching suppliers is always human-approved.
  if (action === 'alternate_supplier' || action === 'source_elsewhere') return true;

  return false;
}

async function actOnShortfall(decision, evidence) {
  const action = normalizeDecision(decision.decision);
  const needsApproval = requiresShortfallApproval(decision);

  if (action === 'escalate') {
    return { actionTaken: null, status: 'pending_human_approval', needsApproval: true };
  }

  if (action === 'rely_on_inventory') {
    return {
      actionTaken: null,
      status: needsApproval ? 'pending_human_approval' : 'no_action_relying_on_inventory',
      needsApproval,
    };
  }

  // source_elsewhere / alternate_supplier / raise_additional_po -> propose or create a new PO
  const supplierId = decision.chosen_supplier_id
    || (action === 'raise_additional_po'
      ? evidence.originalSupplier?._id
      : evidence.bestAlternate?._id);
  const quantity = decision.additional_quantity ?? evidence.shortfallQty;

  if (needsApproval) {
    return {
      actionTaken: { type: 'create_po', productId: evidence.productId, supplierId, quantity },
      status: 'pending_human_approval',
      needsApproval: true,
    };
  }

  const supplier = [evidence.originalSupplier, ...evidence.alternateSuppliers]
    .filter(Boolean)
    .find(s => String(s._id) === String(supplierId));

  const poRes = await axios.post(`${BASE_URL}/api/pos`, {
    productId: evidence.productId,
    supplierId,
    quantityOrdered: quantity,
    quantityConfirmed: quantity,
    status: 'open',
    expectedDelivery: new Date(Date.now() + (supplier?.leadTimeDays ?? 14) * 24 * 60 * 60 * 1000),
  });

  return { actionTaken: { type: 'create_po', po: poRes.data }, status: 'executed', needsApproval: false };
}

module.exports = {
  act,
  requiresHumanApproval,
  actOnShortfall,
  requiresShortfallApproval,
  normalizeDecision,
  LOW_CONFIDENCE_THRESHOLD,
};