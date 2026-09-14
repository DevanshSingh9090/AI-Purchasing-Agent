# AI Purchasing Agent

An agentic system that **investigates, decides, acts, and validates** purchasing
decisions — not a chatbot that answers purchasing questions. Built around a real
feedback loop: when a decision's real-world outcome doesn't match what was expected,
the agent re-enters its decision step with new evidence, retries a capped number of
times, and escalates to a human if it still can't resolve cleanly.

## Scenarios implemented

- ✅ **Scenario 1 — Purchase Recommendation Review**: the system recommends buying N
  units of a product; the agent gathers inventory, demand, open POs, supplier terms,
  budget, and storage, then decides `accept` / `modify` / `reject` / `investigate`.
- ✅ **Scenario 2 — Supplier Cannot Fulfil the Purchase**: an existing PO's supplier
  reports they can only deliver part of what was ordered; the agent decides whether to
  source elsewhere, use an alternate supplier, raise an additional PO with the same
  supplier, rely on existing inventory, or escalate.
- ⏭️ **Scenario 3 (Demand/Forecast Changed)** and **Scenario 4 (Purchasing
  Constraint)** are **not implemented** — see [Scope & rationale](#scope--rationale)
  below for why, and how each would extend this same architecture.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the full flow diagram —
`investigate → decide → act → validate` for both scenarios, including exactly where
the feedback loop retries and escalates.

**In short**: a hand-written state machine, not an autonomous LangChain agent-executor.
The LLM (Gemini, via LangChain.js) is called only inside `decide`, on evidence already
gathered deterministically — it reasons over facts, it doesn't fetch them. Every LLM
output passes through code-level guardrails (MOQ, budget, storage) before being trusted.

## Tech stack

- **Backend**: Node.js + Express — mock tool endpoints as real REST routes
  (`/api/inventory`, `/api/demand`, `/api/pos`, `/api/suppliers`, `/api/budget`,
  `/api/storage`, `/api/products`)
- **Agent orchestration**: hand-written JS state machine (`backend/src/agent/`)
- **LLM**: LangChain.js, Gemini (`@langchain/google-genai`) primary, Mistral
  (`@langchain/mistralai`) as a documented fallback — both free-tier, no
  Anthropic/OpenAI keys used
- **Persistence**: MongoDB + Mongoose. The `DecisionLog` collection is the audit trail
  and doubles as the evaluation harness's data source
- **Evaluation**: a small hand-written test runner (`backend/eval/`) — deliberately not
  Jest/Mocha, per the brief's guidance not to over-build this part

## Setup & run instructions

### Prerequisites
- Node.js 18+
- MongoDB running locally or a connection string to a hosted instance (e.g. MongoDB Atlas free tier)
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Install
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in `.env`:
- `MONGODB_URI` — your MongoDB connection string
- `GOOGLE_API_KEY` — your Gemini API key
- Leave the rest at their defaults unless you need to change the model or thresholds

### 3. Seed mock data
```bash
npm run seed
```
This wipes and reinserts a realistic dataset: 5 products, 3 suppliers, 2 open purchase
orders, a budget, and storage capacity. **Copy a product `_id` from the console output**
— you'll need it to trigger scenarios manually, or use `GET /api/products` to list all
products' IDs at any time.

### 4. Start the backend
```bash
npm run dev
```
Runs on `http://localhost:4000` by default. Confirm it's up:
```bash
curl http://localhost:4000/health
```

### 5. Trigger a scenario manually

**Scenario 1** — recommend buying 800 units of a product:
```bash
node src/agent/testOrchestrator.js <product_id>
```

**Scenario 2** — simulate a supplier shortfall on an existing PO:
```bash
# find an open PO's id first:
curl http://localhost:4000/api/pos/<product_id>

# then simulate the supplier only delivering part of it:
node src/agent/testShortfall.js <po_id> <fulfilled_quantity>
```

Both print the full evidence gathered, the decision, the action taken, and the
validation result to the console, and write a `DecisionLog` document to MongoDB.

### 6. Run the evaluation harness
```bash
# in a second terminal, with npm run dev still running in the first:
npm run eval
```
Runs 9 deterministic unit tests (guardrails, approval gating — no DB, no LLM) followed
by 7 end-to-end tests through the real orchestrator, database, and Gemini. Writes a
report to `backend/eval/eval-report.md`.

## Description of approach

The brief states the goal is "a system capable of making, executing, and validating
purchasing decisions," and that the feedback loop design is what it's most interested
in. Every design decision here traces back to that.

**Why a hand-written state machine instead of an autonomous agent loop?** Explainability.
An autonomous LangChain agent-executor decides its own tool-calling sequence, which makes
it harder to reason about and defend live. Here, every transition —
`investigate → decide → act → validate`, and the retry/escalate branch — is something we
chose explicitly and can walk through line by line.

**Why does the LLM only get called once, inside `decide`?** To keep its job narrow:
reason over evidence that's already been gathered deterministically, and return a single
structured decision. It never decides what data to fetch or how to fetch it — that keeps
the surface area for hallucination small and the system's behavior auditable.

**Why guardrails after the LLM call, not just a good prompt?** Because prompts aren't
contracts. If the model proposes a `modify` quantity that violates a supplier's MOQ, or
would exceed remaining budget or storage, that's caught in code — `applyGuardrails()` /
`applyShortfallGuardrails()` — and forced to `investigate` / `escalate` rather than trusted.

**Why validate the *actual* post-action state, not just the pre-action decision?**
Because a decision can look fine on paper and still be wrong once acted on — reality can
shift between deciding and acting (this is exactly what Scenario 2 demonstrates: the
world changes after a PO already exists). `validate.js` re-fetches real budget/storage
state after a PO is created and checks it against constraints again. If it fails, the
agent re-enters `decide` with the failure reason folded into its evidence, retries up to
`MAX_DECIDE_RETRIES` (default 2), and escalates to a human if it still can't resolve.

**Why gate some actions behind human approval instead of full automation?** The brief
poses "when human approval may be appropriate" as a design question. Here: any `modify`
or `reject` decision, any decision below the confidence threshold (default 0.6), and any
Scenario 2 decision that switches suppliers, all require human approval before a real PO
is created — only a high-confidence `accept` (Scenario 1) or `raise_additional_po` with
the same supplier (Scenario 2) auto-executes.

## Validation strategy — how agent decisions are validated

Two layers, testing different things:

1. **Pre-action guardrails** (`decide.js`) — deterministic checks run immediately after
   the LLM responds, before anything is acted on. Catches an LLM-proposed quantity that
   violates MOQ, budget, or storage, and forces the decision to `investigate`/`escalate`
   instead of executing it.

2. **Post-action validation / feedback loop** (`validate.js`) — after a PO is actually
   created, re-fetches the real resulting budget and storage state and checks it against
   constraints again. This is the centerpiece the brief calls out: if reality doesn't
   match the plan, the agent doesn't just fail silently — it retries `decide` with the
   failure folded into its evidence (up to `MAX_DECIDE_RETRIES`), and escalates to a
   human if retries are exhausted. Every outcome (`completed`, `escalated`,