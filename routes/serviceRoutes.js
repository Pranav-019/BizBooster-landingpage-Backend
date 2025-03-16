const express = require('express');
const router = express.Router();
const multer = require('multer');
const ImageKit = require('imagekit');
const Service = require('../models/service');

// Use memory storage for Multer (no local uploads folder needed)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ImageKit configuration
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// POST route to submit service data and upload file to ImageKit
router.post('/submit-service', upload.single('file'), async (req, res) => {
  try {
    let fileUrl = '';

    // Upload file to ImageKit if file is present
    if (req.file) {
      const imagekitResponse = await imagekit.upload({
        file: req.file.buffer, // Directly using in-memory buffer
        fileName: req.file.originalname,
      });

      fileUrl = imagekitResponse.url;
    }

    // Create a new service record
    const newService = new Service({
      firstName: req.body.firstName,
      middleName: req.body.middleName,
      lastName: req.body.lastName,
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      address: req.body.address,
      module: req.body.module,
      message: req.body.message,
      fileUrl: fileUrl,
    });

    await newService.save();
    res.status(201).json({ success: true, message: 'Service data submitted successfully.' });
  } catch (error) {
    console.error('Error submitting service:', error);
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

// GET route to fetch all service records
router.get('/get-services', async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services.' });
  }
});

module.exports = router;
