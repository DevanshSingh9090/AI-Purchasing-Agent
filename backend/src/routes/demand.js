const express = require('express');
const router = express.Router();
const DemandForecast = require('../models/DemandForecast');

// GET /api/demand/:productId
router.get('/:productId', async (req, res) => {
  try {
    const forecast = await DemandForecast.findOne({ productId: req.params.productId })
      .sort({ periodStart: -1 });
    if (!forecast) return res.status(404).json({ error: 'No forecast found' });
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;