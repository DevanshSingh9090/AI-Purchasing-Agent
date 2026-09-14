const mongoose = require('mongoose');

const storageCapacitySchema = new mongoose.Schema({
  totalCapacity: { type: Number, required: true },
  usedCapacity: { type: Number, required: true, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('StorageCapacity', storageCapacitySchema);