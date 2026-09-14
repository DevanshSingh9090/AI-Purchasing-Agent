const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseId: { type: String, required: true },
  currentQuantity: { type: Number, required: true },
  reservedQuantity: { type: Number, required: true, default: 0 },
  availableQuantity: { type: Number, required: true }, // currentQuantity - reservedQuantity
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);