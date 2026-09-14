const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  currentInventory: { type: Number, required: true, default: 0 },
  unitCost: { type: Number, required: true },
  storageUnitsPerItem: { type: Number, required: true, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);