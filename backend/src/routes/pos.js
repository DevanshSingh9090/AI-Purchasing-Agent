const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');

// GET /api/pos -> all active purchase orders
router.get('/', async (req, res) => {
  try {
    const pos = await PurchaseOrder.find({
      status: { $in: ['open', 'partially_fulfilled'] },
    });

    res.json(pos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pos/:productId -> open POs for a product
router.get('/:productId', async (req, res) => {
  try {
    const pos = await PurchaseOrder.find({
      productId: req.params.productId,
      status: { $in: ['open', 'partially_fulfilled'] },
    });

    res.json(pos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pos/po/:id -> fetch a single PO
router.get('/po/:id', async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);

    if (!po) {
      return res.status(404).json({ error: 'PO not found' });
    }

    res.json(po);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pos -> create a new PO
router.post('/', async (req, res) => {
  try {
    const po = await PurchaseOrder.create(req.body);
    res.status(201).json(po);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/pos/:id -> update PO
router.patch('/:id', async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!po) {
      return res.status(404).json({ error: 'PO not found' });
    }

    res.json(po);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;