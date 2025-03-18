const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const ImageKit = require('imagekit');
const ContentSection = require('../models/ContentSection');

// ImageKit config
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST route - Create content section with ONE image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { Heading, Subheading, content } = req.body;
    const parsedContent = JSON.parse(content); // content = JSON string of array of { title, description }

    // Upload single image to ImageKit
    const uploadedImage = await imagekit.upload({
      file: req.file.buffer,
      fileName: `${uuidv4()}-${req.file.originalname}`,
      useUniqueFileName: true,
      folder: '/contentSection'
    });

    const newSection = new ContentSection({
      Heading,
      Subheading,
      image: uploadedImage.url,
      content: parsedContent
    });

    await newSection.save();
    res.status(201).json({ message: 'Content section created successfully', section: newSection });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create content section' });
  }
});

// GET route - Fetch all sections
router.get('/get', async (req, res) => {
  try {
    const sections = await ContentSection.find().sort({ createdAt: -1 });
    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch content sections' });
  }
});

module.exports = router;
