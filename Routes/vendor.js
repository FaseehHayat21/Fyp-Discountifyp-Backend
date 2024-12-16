const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/vendors/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const vendors = await Vendor.find({ category: category });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/deals/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const deals = await Deal.find({ vendor: vendorId });
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
