const express = require('express');
const router = express.Router();
const StorageCapacity = require('../models/StorageCapacity');

// GET /api/storage -> current storage capacity
router.get('/', async (req, res) => {
  try {
    const storage = await StorageCapacity.findOne().sort({ createdAt: -1 });
    if (!storage) return res.status(404).json({ error: 'No storage record found' });
    res.json(storage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;