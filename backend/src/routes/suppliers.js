const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');

// GET /api/suppliers/:productId -> suppliers that supply this product
router.get('/:productId', async (req, res) => {
  try {
    const suppliers = await Supplier.find({ productsSupplied: req.params.productId });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;