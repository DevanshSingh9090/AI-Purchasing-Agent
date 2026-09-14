# Architecture

## Overview

The agent is a hand-written state machine — `investigate → decide → act → validate` —
not an autonomous LangChain agent-executor. Every transition is explicit and traceable,
by design (see `README.md` § Design Decisions for why).

The LLM (Gemini, via LangChain.js) is called **only** inside `decide`. It never fetches
its own facts — all evidence is gathered deterministically beforehand, and every LLM
output passes through deterministic guardrails before being trusted.

## Scenario 1 — Purchase Recommendation Review

```mermaid
flowchart TD
    Trigger["Trigger: system recommends<br/>N units of Product X"] --> Investigate

    subgraph Investigate["1. INVESTIGATE (investigate.js)"]
        direction TB
        I1["GET /api/products/:id"]
        I2["GET /api/inventory/:productId"]
        I3["GET /api/demand/:productId"]
        I4["GET /api/pos/:productId"]
        I5["GET /api/suppliers/:productId"]
        I6["GET /api/budget"]
        I7["GET /api/storage"]
        I1 & I2 & I3 & I4 & I5 & I6 & I7 --> IEvidence["Assemble evidence object:<br/>gap = demand − (inventory + open POs),<br/>chosen supplier, cost, storage need"]
    end

    Investigate --> Decide

    subgraph Decide["2. DECIDE (decide.js)"]
        direction TB
        D1["LangChain.js → Gemini<br/>(structured JSON only)"]
        D1 --> D2{"Guardrails:<br/>MOQ / budget / storage<br/>respected?"}
        D2 -->|No, modify violates a constraint| D3["Force decision → investigate"]
        D2 -->|Yes| D4["decision: accept / modify /<br/>reject / investigate<br/>+ reasons + confidence"]
    end

    Decide --> Act

    subgraph Act["3. ACT (act.js)"]
        direction TB
        A1{"decision ==<br/>investigate?"}
        A1 -->|Yes| A2["No action taken"]
        A1 -->|No| A3{"Human approval<br/>required?<br/>(modify / reject /<br/>low confidence)"}
        A3 -->|Yes| A4["Propose PO,<br/>status: pending_human_approval<br/>(NOT created yet)"]
        A3 -->|No, accept + high confidence| A5["POST /api/pos<br/>→ real PO created"]
    end

    Act --> Validate

    subgraph Validate["4. VALIDATE (validate.js) — feedback loop centerpiece"]
        direction TB
        V1{"actionResult.status?"}
        V1 -->|pending_human_approval| V2["valid: null, pending: true<br/>(deferred, not a failure)"]
        V1 -->|no_action / rejected| V3["valid: true, nothing to check"]
        V1 -->|executed| V4["Re-fetch REAL post-action state:<br/>GET /api/budget, GET /api/storage"]
        V4 --> V5{"Actual cost/storage<br/>within limits?"}
        V5 -->|Yes| V6["valid: true"]
        V5 -->|No| V7["valid: false<br/>requiresRetry: true"]
    end

    V7 -->|"retries < MAX_RETRIES:<br/>feed failure back into evidence"| Decide
    V7 -->|"retries exceeded MAX_RETRIES"| Escalate["finalStatus: escalated<br/>→ human review"]

    V2 --> LogA["finalStatus: awaiting_approval"]
    V3 --> LogB["finalStatus: completed"]
    V6 --> LogC["finalStatus: completed"]

    LogA & LogB & LogC & Escalate --> DecisionLog["DecisionLog written to MongoDB<br/>(audit trail + eval data source)"]
```

## Scenario 2 — Supplier Cannot Fulfil the Purchase

Branches off the **same** `investigate → decide → act → validate` shape. Only the evidence
gathered, the decision options, and the action taken differ.

```mermaid
flowchart TD
    Trigger2["Trigger: PO exists for N units,<br/>supplier confirms only M can be delivered"] --> Sim

    Sim["Step 0: simulate the real-world event —<br/>PATCH /api/pos/:id<br/>quantityConfirmed = M, status = partially_fulfilled"] --> Inv2

    subgraph Inv2["1. INVESTIGATE (investigateShortfall.js)"]
        direction TB
        SI1["GET the shortfall PO by id"]
        SI2["GET product / inventory / demand"]
        SI3["GET all suppliers for this product<br/>→ split into original vs alternates"]
        SI4["GET budget / storage"]
        SI1 & SI2 & SI3 & SI4 --> SIEvidence["shortfallQty = ordered − confirmed<br/>coverageAfterShortfall = demand − (inventory + confirmed)"]
    end

    Inv2 --> Dec2

    subgraph Dec2["2. DECIDE (decideShortfall.js)"]
        direction TB
        SD1["LangChain.js → Gemini"]
        SD1 --> SD2{"Guardrails:<br/>supplier resolvable?<br/>MOQ / budget / storage OK?"}
        SD2 -->|No| SD3["Force decision → escalate"]
        SD2 -->|Yes| SD4["decision: source_elsewhere /<br/>alternate_supplier /<br/>raise_additional_po /<br/>rely_on_inventory / escalate"]
    end

    Dec2 --> Act2

    subgraph Act2["3. ACT (actOnShortfall.js)"]
        direction TB
        SA1{"decision type?"}
        SA1 -->|escalate| SA2["No action, pending_human_approval"]
        SA1 -->|rely_on_inventory| SA3["No new PO needed"]
        SA1 -->|source_elsewhere / alternate_supplier| SA4["ALWAYS pending_human_approval<br/>(switching supplier = high-stakes)"]
        SA1 -->|raise_additional_po,<br/>high confidence| SA5["POST /api/pos<br/>→ new PO created with same supplier"]
    end

    Act2 --> Val2["4. VALIDATE (validateShortfall.js)<br/>same retry/escalate shape as Scenario 1"]
    Val2 --> DecisionLog2["DecisionLog written<br/>scenario: scenario2_supplier_shortfall"]
```

## Why this design

| Choice | Reason |
|---|---|
| Hand-written state machine, not LangChain agent-executor | Every transition is one we chose — fully explainable and debuggable live, per the brief's explainability requirement |
| LLM called only in `decide`, on pre-gathered evidence | Keeps the LLM's job narrow: reason over facts, don't fetch them — reduces hallucination surface area |
| Deterministic guardrails after every LLM call | The model's output is never trusted blindly — MOQ, budget, and storage are checked in code, not left to the LLM's arithmetic |
| Validation re-checks *actual* post-action state, not just the proposal | Catches drift between what was intended and what actually happened — this is the feedback loop the brief calls out by name |
| Retry with augmented evidence, capped, then escalate | Demonstrates a self-correcting loop without looping forever — `previousAttemptFailed` context lets the LLM reason about *why* the first attempt failed |
| Human approval gates `modify` / `reject` / low confidence / supplier switches | Directly answers the brief's "when human approval may be appropriate" |
| Scenario 2 reuses the identical 4-step shape | Proves the architecture generalizes — same reason Scenario 3/4 are documented as natural extensions rather than built |