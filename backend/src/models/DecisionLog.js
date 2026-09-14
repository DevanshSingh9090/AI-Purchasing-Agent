const mongoose = require("mongoose");

const decisionLogSchema = new mongoose.Schema(
  {
    scenario: {
      type: String,
      required: true,
    },

    triggerInput: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    evidenceGathered: {
      type: mongoose.Schema.Types.Mixed,
    },

    decision: {
      type: mongoose.Schema.Types.Mixed,
    },

    actionTaken: {
      type: mongoose.Schema.Types.Mixed,
    },

    validationResult: {
      type: mongoose.Schema.Types.Mixed,
    },

    retries: {
      type: Number,
      default: 0,
    },

    finalStatus: {
      type: String,
      enum: [
        "completed",
        "escalated",
        "failed",
        "awaiting_approval",
        "rejected",
      ],
      default: "failed",
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DecisionLog", decisionLogSchema);