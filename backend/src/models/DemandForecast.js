const mongoose = require('mongoose');

const demandForecastSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  expectedDemand: { type: Number, required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  actualSalesToDate: { type: Number }, // reserved for Scenario 3
}, { timestamps: true });

module.exports = mongoose.model('DemandForecast', demandForecastSchema);