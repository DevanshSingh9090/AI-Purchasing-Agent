const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// GET /api/inventory/:productId
router.get('/:productId', async (req, res) => {
  try {
    const records = await Inventory.find({ productId: req.params.productId });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;