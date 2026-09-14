const mongoose = require('mongoose');

const decisionLogSchema = new mongoose.Schema({
  scenario: { type: String, required: true }, // e.g. "scenario1_purchase_review"
  triggerInput: { type: mongoose.Schema.Types.Mixed, required: true },
  evidenceGathered: { type: mongoose.Schema.Types.Mixed },
  decision: { type: mongoose.Schema.Types.Mixed }, // shape varies by scenario (Scenario 1 vs Scenario 2)
  actionTaken: { type: mongoose.Schema.Types.Mixed },
  validationResult: { type: mongoose.Schema.Types.Mixed },
  retries: { type: Number, default: 0 },
  finalStatus: { type: String, enum: ['completed', 'escalated', 'failed', 'awaiting_approval'] },
}, { timestamps: true });

module.exports = mongoose.model('DecisionLog', decisionLogSchema);