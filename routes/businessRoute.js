const express = require('express');
const router = express.Router();
const BusinessInfo = require('../models/BusinessInfo');

// Create new entry
router.post('/create', async (req, res) => {
  try {
    const newEntry = new BusinessInfo(req.body);
    const savedEntry = await newEntry.save();
    res.status(201).json(savedEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all entries
router.get('/get', async (req, res) => {
  try {
    const allEntries = await BusinessInfo.find();
    res.status(200).json(allEntries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
