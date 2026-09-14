const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatMistralAI } = require('@langchain/mistralai');

function getLLM() {
  const provider = process.env.LLM_PROVIDER || 'gemini';
  if (provider === 'mistral') {
    return new ChatMistralAI({ apiKey: process.env.MISTRAL_API_KEY, model: process.env.LLM_MODEL || 'mistral-large-latest', temperature: 0.2 });
  }
  return new ChatGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY, model: process.env.LLM_MODEL || 'gemini-2.5-flash', temperature: 0.2 });
}

const DECISION_SYSTEM_PROMPT = `You are a purchasing decision agent. You will be given evidence about
a proposed purchase (inventory, demand, open POs, supplier terms, budget, storage).

Decide one of: accept, modify, reject, investigate.
- accept: the recommended quantity is appropriate given the evidence.
- modify: a different quantity is more appropriate — provide modified_quantity.
- reject: no purchase should be made right now.
- investigate: evidence is insufficient or contradictory to decide confidently — list what's missing.

Respond ONLY with valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
  "decision": "accept" | "modify" | "reject" | "investigate",
  "modified_quantity": number | null,
  "confidence": number (0 to 1),
  "reasons": string[],
  "evidence_used": string[],
  "missingInformation": string[]
}`;

async function decide(evidence) {
  const llm = getLLM();

  const userPrompt = `Evidence:\n${JSON.stringify(evidence, null, 2)}\n\nMake your decision.`;

  const response = await llm.invoke([
    { role: 'system', content: DECISION_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]);

  let parsed;
  try {
    const cleaned = response.content.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // If the model didn't return valid JSON, force investigate rather than guessing
    return {
      decision: 'investigate',
      modified_quantity: null,
      confidence: 0,
      reasons: ['LLM response was not valid JSON'],
      evidence_used: [],
      missingInformation: ['Valid structured decision from LLM'],
      raw: response.content,
    };
  }

  return applyGuardrails(parsed, evidence);
}

/**
 * Deterministic guardrails — never trust the LLM's number blindly.
 * If modified_quantity violates MOQ or budget, force investigate.
 */
function applyGuardrails(decision, evidence) {
  const { chosenSupplier, budget, storage } = evidence;

  if (decision.decision === 'modify' && decision.modified_quantity != null) {
    const qty = decision.modified_quantity;

    if (chosenSupplier && qty < chosenSupplier.minimumOrderQty) {
      return {
        ...decision,
        decision: 'investigate',
        reasons: [...(decision.reasons || []), `Guardrail: modified_quantity ${qty} is below supplier MOQ ${chosenSupplier.minimumOrderQty}`],
        missingInformation: [...(decision.missingInformation || []), 'Valid quantity respecting supplier MOQ'],
      };
    }

    const estimatedCost = qty * (evidence.estimatedCost / evidence.recommendedQty);
    if (estimatedCost > budget.remainingBudget) {
      return {
        ...decision,
        decision: 'investigate',
        reasons: [...(decision.reasons || []), `Guardrail: estimated cost ${estimatedCost} exceeds remaining budget ${budget.remainingBudget}`],
        missingInformation: [...(decision.missingInformation || []), 'Budget approval or reduced quantity'],
      };
    }

    const estimatedStorage = qty * (evidence.storage.estimatedStorageNeeded / evidence.recommendedQty);
    if (estimatedStorage > storage.remainingStorage) {
      return {
        ...decision,
        decision: 'investigate',
        reasons: [...(decision.reasons || []), `Guardrail: estimated storage ${estimatedStorage} exceeds remaining capacity ${storage.remainingStorage}`],
        missingInformation: [...(decision.missingInformation || []), 'Storage capacity or reduced quantity'],
      };
    }
  }

  return decision;
}

const SHORTFALL_SYSTEM_PROMPT = `You are a purchasing decision agent handling a supplier fulfillment shortfall.
A purchase order was already placed, but the supplier can only deliver part of it.

Decide one of: source_elsewhere, alternate_supplier, raise_additional_po, rely_on_inventory, escalate.
- source_elsewhere: place a new PO with a different, non-obvious supplier for the shortfall (or part of it).
- alternate_supplier: place a new PO specifically with the best available alternate supplier from the evidence.
- raise_additional_po: place a new PO with the SAME original supplier for the remaining shortfall quantity.
- rely_on_inventory: no new PO needed — existing inventory plus what was actually confirmed already covers demand.
- escalate: evidence is insufficient or the situation needs human judgment (e.g. no viable alternate supplier, or shortfall too large).

Respond ONLY with valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
  "decision": "source_elsewhere" | "alternate_supplier" | "raise_additional_po" | "rely_on_inventory" | "escalate",
  "additional_quantity": number | null,
  "chosen_supplier_id": string | null,
  "confidence": number (0 to 1),
  "reasons": string[],
  "evidence_used": string[],
  "missingInformation": string[]
}`;

async function decideShortfall(evidence) {
  const llm = getLLM();

  const userPrompt = `Evidence:\n${JSON.stringify(evidence, null, 2)}\n\nMake your decision.`;

  const response = await llm.invoke([
    { role: 'system', content: SHORTFALL_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]);

  let parsed;
  try {
    const cleaned = response.content.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    return {
      decision: 'escalate',
      additional_quantity: null,
      chosen_supplier_id: null,
      confidence: 0,
      reasons: ['LLM response was not valid JSON'],
      evidence_used: [],
      missingInformation: ['Valid structured decision from LLM'],
      raw: response.content,
    };
  }

  return applyShortfallGuardrails(parsed, evidence);
}

/**
 * Deterministic guardrails for the shortfall decision — same philosophy as
 * applyGuardrails: never trust the LLM's supplier choice or quantity blindly.
 */
function applyShortfallGuardrails(decision, evidence) {
  if (['source_elsewhere', 'alternate_supplier', 'raise_additional_po'].includes(decision.decision)) {
    const qty = decision.additional_quantity ?? evidence.shortfallQty;

    const supplierId = decision.chosen_supplier_id
      || (decision.decision === 'raise_additional_po' ? evidence.originalSupplier?._id : evidence.bestAlternate?._id);

    const supplier = [evidence.originalSupplier, ...evidence.alternateSuppliers]
      .filter(Boolean)
      .find(s => String(s._id) === String(supplierId));

    if (!supplier) {
      return {
        ...decision,
        decision: 'escalate',
        reasons: [...(decision.reasons || []), 'Guardrail: no valid supplier could be resolved for this decision'],
        missingInformation: [...(decision.missingInformation || []), 'A valid supplier to fulfil the shortfall'],
      };
    }

    if (qty < supplier.minimumOrderQty) {
      return {
        ...decision,
        decision: 'escalate',
        reasons: [...(decision.reasons || []), `Guardrail: quantity ${qty} is below supplier MOQ ${supplier.minimumOrderQty}`],
        missingInformation: [...(decision.missingInformation || []), 'Quantity respecting supplier MOQ'],
      };
    }

    const estimatedCost = qty * evidence.estimatedCostPerUnit;
    if (estimatedCost > evidence.budget.remainingBudget) {
      return {
        ...decision,
        decision: 'escalate',
        reasons: [...(decision.reasons || []), `Guardrail: estimated cost ${estimatedCost} exceeds remaining budget ${evidence.budget.remainingBudget}`],
        missingInformation: [...(decision.missingInformation || []), 'Budget approval or reduced quantity'],
      };
    }

    const estimatedStorage = qty * evidence.estimatedStoragePerUnit;
    if (estimatedStorage > evidence.storage.remainingStorage) {
      return {
        ...decision,
        decision: 'escalate',
        reasons: [...(decision.reasons || []), `Guardrail: estimated storage ${estimatedStorage} exceeds remaining capacity ${evidence.storage.remainingStorage}`],
        missingInformation: [...(decision.missingInformation || []), 'Storage capacity or reduced quantity'],
      };
    }
  }

  return decision;
}

module.exports = { decide, decideShortfall };