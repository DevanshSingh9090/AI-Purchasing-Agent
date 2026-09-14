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

module.exports = { decide };