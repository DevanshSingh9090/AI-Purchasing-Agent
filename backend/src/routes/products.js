const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products -> all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ sku: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id -> single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;