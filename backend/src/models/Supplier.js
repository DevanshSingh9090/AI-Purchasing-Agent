const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  productsSupplied: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  leadTimeDays: { type: Number, required: true },
  minimumOrderQty: { type: Number, required: true },
  reliabilityScore: { type: Number, min: 0, max: 1 }, // optional
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);