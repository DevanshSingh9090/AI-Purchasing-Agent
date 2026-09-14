const mongoose = require('mongoose');

const decisionLogSchema = new mongoose.Schema({
  scenario: { type: String, required: true }, // e.g. "scenario1_purchase_review"
  triggerInput: { type: mongoose.Schema.Types.Mixed, required: true },
  evidenceGathered: { type: mongoose.Schema.Types.Mixed },
  decision: {
    decision: { type: String, enum: ['accept', 'modify', 'reject', 'investigate'] },
    modified_quantity: Number,
    confidence: Number,
    reasons: [String],
    evidence_used: [String],
    missingInformation: [String],
  },
  actionTaken: { type: mongoose.Schema.Types.Mixed },
  validationResult: { type: mongoose.Schema.Types.Mixed },
  retries: { type: Number, default: 0 },
  finalStatus: { type: String, enum: ['completed', 'escalated', 'failed'] },
}, { timestamps: true });

module.exports = mongoose.model('DecisionLog', decisionLogSchema);