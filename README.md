# AI Purchasing Agent

## Overview
Agentic system that investigates, decides, acts, and validates purchasing
decisions (Scenario 1: Purchase Recommendation Review; Scenario 2: Supplier
Fulfillment Shortfall).

## Architecture
See `docs/architecture.png` (added in Phase 7).

## Setup
1. `cd backend && npm install`
2. Copy `.env.example` to `.env` and fill in MongoDB URI + LLM API key
3. `npm run seed` to load mock data
4. `npm run dev` to start the server

## Scenarios implemented
- [ ] Scenario 1
- [ ] Scenario 2

## Tech stack
Node.js, Express, MongoDB/Mongoose, LangChain.js (Gemini primary, Mistral fallback)

## Testing / evaluation
See Phase 6 eval harness (added later).