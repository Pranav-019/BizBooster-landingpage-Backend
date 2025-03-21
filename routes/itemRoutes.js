const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const ImageKit = require('imagekit');
require("dotenv").config();

const router = express.Router();

// ImageKit Configuration
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Multer Setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Mongoose Schema
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

// POST: Add a new item (with file uploads)
router.post('/add', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'arrayofimage', maxCount: 10 }
]), async (req, res) => {
  try {
    const {
      heading, subheading, features, category,
      description, earning, requirements, feature2
    } = req.body;

    const featureList = features ? JSON.parse(features) : [];
    const feature2List = feature2 ? JSON.parse(feature2) : [];

    let imageUrl = null;
    let arrayOfImagesList = [];

    if (req.files?.image?.length > 0) {
      const uploadedImage = await imagekit.upload({
        file: req.files.image[0].buffer,
        fileName: req.files.image[0].originalname
      });
      imageUrl = uploadedImage.url;
    }

    if (req.files?.arrayofimage?.length > 0) {
      for (const img of req.files.arrayofimage) {
        const uploaded = await imagekit.upload({
          file: img.buffer,
          fileName: img.originalname
        });
        arrayOfImagesList.push(uploaded.url);
      }
    }

    const newItem = new Item({
      heading, subheading, image: imageUrl, arrayofimage: arrayOfImagesList,
      features: featureList, category, description, earning, requirements, feature2: feature2List
    });

    await newItem.save();
    res.status(201).json({ message: "Item created successfully", data: newItem });
  } catch (error) {
    console.error('POST /add error:', error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// GET: Fetch all items
router.get('/get', async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json({ data: items });
  } catch (error) {
    console.error('GET /get error:', error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// GET: Fetch single item by ID
router.get('/get/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.status(200).json({ data: item });
  } catch (error) {
    console.error('GET /get/:id error:', error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// PUT: Full item update (with file uploads via multer and ImageKit)
router.put('/update/:id', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'arrayofimage', maxCount: 10 }
]), async (req, res) => {
  try {
    console.log('PUT /update/:id - Received body:', req.body, 'Files:', req.files); // Debug incoming data
    const {
      heading, subheading, image, arrayofimage, features, category,
      description, earning, requirements, feature2
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    const updateData = {};

    if (heading !== undefined) updateData.heading = heading;
    if (subheading !== undefined) updateData.subheading = subheading;
    if (image !== undefined) updateData.image = image; // URL or existing value if no file
    if (arrayofimage !== undefined) updateData.arrayofimage = JSON.parse(arrayofimage); // Parse if sent as string
    if (features !== undefined) updateData.features = JSON.parse(features);
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (earning !== undefined) updateData.earning = earning;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (feature2 !== undefined) updateData.feature2 = JSON.parse(feature2);

    // Handle image upload
    if (req.files?.image?.length > 0) {
      const uploadedImage = await imagekit.upload({
        file: req.files.image[0].buffer,
        fileName: req.files.image[0].originalname
      });
      updateData.image = uploadedImage.url;
    }

    // Handle arrayofimage upload
    if (req.files?.arrayofimage?.length > 0) {
      const arrayOfImagesList = [];
      for (const img of req.files.arrayofimage) {
        const uploaded = await imagekit.upload({
          file: img.buffer,
          fileName: img.originalname
        });
        arrayOfImagesList.push(uploaded.url);
      }
      updateData.arrayofimage = arrayOfImagesList; // Overwrites existing array
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedItem) return res.status(404).json({ error: "Item not found" });

    res.status(200).json({ message: "Item updated successfully", data: updatedItem });
  } catch (error) {
    console.error('PUT /update/:id error:', error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// PATCH: Add to features/feature2/arrayofimage (with optional file upload)
router.patch('/add-point/:id', upload.single('image'), async (req, res) => {
  try {
    console.log('PATCH /add-point/:id - Received body:', req.body, 'File:', req.file); // Debug
    const { type, value } = req.body;
    if (!['features', 'feature2', 'arrayofimage'].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    let update = {};

    if (type === 'arrayofimage' && req.file) {
      const uploaded = await imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname
      });
      update = { $push: { arrayofimage: uploaded.url } };
    } else if (value) {
      update = { $push: { [type]: value } };
    } else {
      return res.status(400).json({ error: "Value or image required" });
    }

    const updated = await Item.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) return res.status(404).json({ error: "Item not found" });
    res.status(200).json({ message: "Point added", data: updated });
  } catch (error) {
    console.error('PATCH /add-point/:id error:', error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// PATCH: Remove from features/feature2/arrayofimage
router.patch('/remove-point/:id', async (req, res) => {
  try {
    const { type, value } = req.body;
    if (!['features', 'feature2', 'arrayofimage'].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }
    if (!value) return res.status(400).json({ error: "Value required to remove" });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    const update = { $pull: { [type]: value } };
    const updated = await Item.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) return res.status(404).json({ error: "Item not found" });

    res.status(200).json({ message: "Point removed", data: updated });
  } catch (error) {
    console.error('PATCH /remove-point/:id error:', error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// DELETE: Delete item
router.delete('/delete/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: "Item not found" });
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error('DELETE /delete/:id error:', error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports = router;