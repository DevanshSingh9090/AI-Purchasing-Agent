const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  quantityOrdered: { type: Number, required: true },
  quantityConfirmed: { type: Number },
  status: {
    type: String,
    enum: ['open', 'fulfilled', 'partially_fulfilled', 'cancelled'],
    default: 'open',
  },
  expectedDelivery: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);