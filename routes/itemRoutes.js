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

// Configure Multer for file handling
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Mongoose Schema
const ItemSchema = new mongoose.Schema({
    heading: String,
    image: String,
    features: [String]
});

const Item = mongoose.model('Item', ItemSchema);

// POST: Add a new item
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { heading, features } = req.body;
        const featureList = JSON.parse(features);

        if (!req.file) {
            return res.status(400).json({ error: "Image is required" });
        }

        const uploadedImage = await imagekit.upload({
            file: req.file.buffer,
            fileName: req.file.originalname
        });

        const newItem = new Item({
            heading,
            image: uploadedImage.url,
            features: featureList
        });

        await newItem.save();
        res.status(201).json({ message: "Item created successfully", data: newItem });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// PUT: Update an existing item
router.put('/update/:id', upload.single('image'), async (req, res) => {
    try {
        const { heading, features } = req.body;
        const featureList = features ? JSON.parse(features) : undefined;
        let updateData = { heading, features: featureList };

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
