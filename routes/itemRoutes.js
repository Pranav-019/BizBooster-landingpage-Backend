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

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});

// Mongoose Schema - All fields optional
const ItemSchema = new mongoose.Schema({
  heading: { type: String, default: null },
  subheading: { type: String, default: null },
  image: { type: String, default: null },
  arrayofimage: { type: [String], default: [] },
  features: { type: [String], default: [] },
  category: { type: String, default: null },
  description: { type: String, default: null },
  earning: { type: String, default: null },
  requirements: { type: String, default: null },
  feature2: { type: [String], default: [] }
});

const Item = mongoose.model('Item', ItemSchema);

// POST: Add a new item
router.post('/add', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'arrayofimage', maxCount: 10 }
]), async (req, res) => {
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
    let arrayOfImagesList = [];

    // Upload main image (single)
    if (req.files.image && req.files.image.length > 0) {
      const uploadedImage = await imagekit.upload({
        file: req.files.image[0].buffer,
        fileName: req.files.image[0].originalname
      });
      imageUrl = uploadedImage.url;
    }

    // Upload array of images (multiple)
    if (req.files.arrayofimage && req.files.arrayofimage.length > 0) {
      for (const img of req.files.arrayofimage) {
        const uploaded = await imagekit.upload({
          file: img.buffer,
          fileName: img.originalname
        });
        arrayOfImagesList.push(uploaded.url);
      }
    }

    const newItem = new Item({
      heading,
      subheading,
      image: imageUrl,
      arrayofimage: arrayOfImagesList,
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
router.put('/update/:id', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'arrayofimage', maxCount: 10 }
]), async (req, res) => {
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

    // Upload new image if provided
    if (req.files.image && req.files.image.length > 0) {
      const uploadedImage = await imagekit.upload({
        file: req.files.image[0].buffer,
        fileName: req.files.image[0].originalname
      });
      updateData.image = uploadedImage.url;
    }

    // Upload arrayofimage if provided
    if (req.files.arrayofimage && req.files.arrayofimage.length > 0) {
      const arrayOfImagesList = [];
      for (const img of req.files.arrayofimage) {
        const uploaded = await imagekit.upload({
          file: img.buffer,
          fileName: img.originalname
        });
        arrayOfImagesList.push(uploaded.url);
      }
      updateData.arrayofimage = arrayOfImagesList;
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
