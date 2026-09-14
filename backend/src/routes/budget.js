const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');

// GET /api/budget -> current active budget
router.get('/', async (req, res) => {
  try {
    const budget = await Budget.findOne().sort({ periodStart: -1 });
    if (!budget) return res.status(404).json({ error: 'No budget found' });
    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;