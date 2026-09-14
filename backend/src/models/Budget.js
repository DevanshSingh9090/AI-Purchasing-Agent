const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  totalBudget: { type: Number, required: true },
  spentSoFar: { type: Number, required: true, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);