const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const multer = require('multer');
const ImageKit = require('imagekit');
const { v4: uuidv4 } = require('uuid');

// ImageKit Config
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });

// Multer (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST route - Create testimonial with image upload
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Upload image to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer,
      fileName: `${uuidv4()}-${req.file.originalname}`,
    });

    const { description, name, location, rating } = req.body;

    const testimonial = new Testimonial({
      description,
      name,
      location,
      image: uploadResponse.url,
      rating,
    });

    await testimonial.save();
    res.status(201).json({ message: 'Testimonial added', testimonial });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload and save testimonial' });
  }
});

// GET route - All testimonials
router.get('/get', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json(testimonials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

module.exports = router;
