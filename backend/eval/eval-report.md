# Evaluation Report

Generated: 2026-09-14T12:46:51.224Z

**16/16 passed**.

## ✅ Guardrail: modify quantity below supplier MOQ is forced to investigate

- Status: **PASS**
- Duration: 1ms

## ✅ Guardrail: modify quantity exceeding remaining budget is forced to investigate

- Status: **PASS**
- Duration: 0ms

## ✅ Guardrail: modify quantity exceeding remaining storage is forced to investigate

- Status: **PASS**
- Duration: 1ms

## ✅ Guardrail: a modify quantity within MOQ/budget/storage is left untouched

- Status: **PASS**
- Duration: 0ms

## ✅ Shortfall guardrail: quantity below chosen supplier MOQ is escalated

- Status: **PASS**
- Duration: 0ms

## ✅ Shortfall guardrail: no resolvable supplier id is escalated

- Status: **PASS**
- Duration: 0ms

## ✅ Approval gate: low-confidence decisions always require human approval, even "accept"

- Status: **PASS**
- Duration: 0ms

## ✅ Approval gate: high-confidence "accept" auto-executes, but "modify"/"reject" always need approval

- Status: **PASS**
- Duration: 0ms

## ✅ Shortfall approval gate: switching suppliers always requires human approval

- Status: **PASS**
- Duration: 0ms

## ✅ Health check: backend server is reachable

- Status: **PASS**
- Duration: 3ms

## ✅ Scenario 1 — baseline recommendation review runs the full loop and logs a decision

- Status: **PASS**
- Duration: 5317ms
- Details:

```json
{
  "productId": "6aa7ec75df7e0774aaac733b",
  "supplierId": "6aa7ec75df7e0774aaac733c",
  "decision": "accept",
  "finalStatus": "completed",
  "retries": 0
}
```

## ✅ Scenario 1 — tight budget: a purchase that would blow the budget is never silently approved

- Status: **PASS**
- Duration: 8743ms
- Details:

```json
{
  "decision": "reject",
  "finalStatus": "awaiting_approval",
  "remainingBudget": 200,
  "retries": 0
}
```

## ✅ Scenario 1 — tight storage: a purchase that would overflow the warehouse is never silently approved

- Status: **PASS**
- Duration: 11196ms
- Details:

```json
{
  "decision": "reject",
  "finalStatus": "awaiting_approval",
  "remainingStorage": 20,
  "retries": 0
}
```

## ✅ Scenario 2 — supplier shortfall runs the full loop with correct shortfall math

- Status: **PASS**
- Duration: 12140ms
- Details:

```json
{
  "poId": "6aa7ec94df7e0774aaac734f",
  "decision": "alternate_supplier",
  "finalStatus": "awaiting_approval",
  "shortfallQty": 250
}
```

## ✅ Scenario 1 — retry-then-escalate: a self-correcting loop never reports "completed" on a bad purchase

- Status: **PASS**
- Duration: 6374ms
- Details:

```json
{
  "decision": "reject",
  "finalStatus": "awaiting_approval",
  "retries": 0,
  "actionStatus": "pending_human_approval"
}
```

## ✅ Scenario 1 — low confidence: an uncertain decision never silently auto-executes

- Status: **PASS**
- Duration: 15645ms
- Details:

```json
{
  "productId": "6aa7ecabdf7e0774aaac7356",
  "decision": "reject",
  "confidence": 0.9,
  "actionStatus": "pending_human_approval",
  "finalStatus": "awaiting_approval"
}
```

