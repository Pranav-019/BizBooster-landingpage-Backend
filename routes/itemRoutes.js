const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const ImageKit = require('imagekit');
require("dotenv").config();

const router = express.Router();

// Configure ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Configure Multer for file uploads (in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Mongoose Schema - All fields optional
const ItemSchema = new mongoose.Schema({
  heading: { type: String, default: null },
  subheading: { type: String, default: null }, // New optional field
  image: { type: String, default: null },
  features: { type: [String], default: [] },
  category: { type: String, default: null },
  description: { type: String, default: null },
  earning: { type: String, default: null },
  requirements: { type: String, default: null },
  feature2: { type: [String], default: [] }
});

const Item = mongoose.model('Item', ItemSchema);

// POST: Add a new item
router.post('/add', upload.single('image'), async (req, res) => {
  try {
    const {
      heading,
      subheading,
      features,
      category,
      description,
      earning,
      requirements,
      feature2
    } = req.body;

    const featureList = features ? JSON.parse(features) : [];
    const feature2List = feature2 ? JSON.parse(feature2) : [];

    let imageUrl = null;
    if (req.file) {
      const uploadedImage = await imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname
      });
      imageUrl = uploadedImage.url;
    }

    const newItem = new Item({
      heading,
      subheading,
      image: imageUrl,
      features: featureList,
      category,
      description,
      earning,
      requirements,
      feature2: feature2List
    });

    await newItem.save();
    res.status(201).json({ message: "Item created successfully", data: newItem });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET all items
router.get('/get', async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json({ data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET item by ID (optional)
router.get('/get/:id?', async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      const item = await Item.findById(id);
      if (!item) return res.status(404).json({ error: "Item not found" });
      return res.status(200).json({ data: item });
    }

    const items = await Item.find();
    res.status(200).json({ data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT: Update an existing item
router.put('/update/:id', upload.single('image'), async (req, res) => {
  try {
    const {
      heading,
      subheading,
      features,
      category,
      description,
      earning,
      requirements,
      feature2
    } = req.body;

    const updateData = {};

    if (heading !== undefined) updateData.heading = heading;
    if (subheading !== undefined) updateData.subheading = subheading;
    if (description !== undefined) updateData.description = description;
    if (earning !== undefined) updateData.earning = earning;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (category !== undefined) updateData.category = category;
    if (features !== undefined) updateData.features = JSON.parse(features);
    if (feature2 !== undefined) updateData.feature2 = JSON.parse(feature2);

    if (req.file) {
      const uploadedImage = await imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname
      });
      updateData.image = uploadedImage.url;
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(200).json({ message: "Item updated successfully", data: updatedItem });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE: Remove an item
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
