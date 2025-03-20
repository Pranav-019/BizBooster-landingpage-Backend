const express = require('express');
const router = express.Router();
const ServicePage = require('../models/servicepage.model');
const multer = require('multer');
const ImageKit = require('imagekit');
require('dotenv').config();

// ImageKit configuration
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Multer setup (in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage }); // ✅ fixed multer instance

// POST: Add a new service page
router.post('/add', upload.array('images'), async (req, res) => {
  try {
    const { servicetitle, titleDescArray, categoryname } = req.body;

    const parsedTitleDescArray = JSON.parse(titleDescArray);
    const parsedCategoryData = JSON.parse(categoryname);

    const uploadedImages = await Promise.all(
      req.files.map((file) =>
        imagekit.upload({
          file: file.buffer,
          fileName: file.originalname,
        })
      )
    );

    const categorynameWithImages = parsedCategoryData.map((item, index) => ({
      image: uploadedImages[index]?.url || '',
      title: item.title,
      description: item.description,
    }));

    const servicePage = new ServicePage({
      servicetitle,
      titleDescArray: parsedTitleDescArray,
      categoryname: categorynameWithImages,
    });

    await servicePage.save();
    res.status(201).json({ message: 'Service Page created successfully', data: servicePage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT: Update a service page by ID
router.put('/update/:id', upload.array('images'), async (req, res) => {
  try {
    const { servicetitle, titleDescArray, categoryname } = req.body;

    const parsedTitleDescArray = JSON.parse(titleDescArray);
    const parsedCategoryData = JSON.parse(categoryname);

    let uploadedImages = [];

    if (req.files && req.files.length > 0) {
      uploadedImages = await Promise.all(
        req.files.map((file) =>
          imagekit.upload({
            file: file.buffer,
            fileName: file.originalname,
          })
        )
      );
    }

    const categorynameWithImages = parsedCategoryData.map((item, index) => ({
      image: uploadedImages[index]?.url || item.image || '',
      title: item.title,
      description: item.description,
    }));

    const updatedData = {
      servicetitle,
      titleDescArray: parsedTitleDescArray,
      categoryname: categorynameWithImages,
    };

    const updatedServicePage = await ServicePage.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedServicePage) {
      return res.status(404).json({ error: 'Service Page not found' });
    }

    res.status(200).json({ message: 'Service Page updated successfully', data: updatedServicePage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET all service pages
router.get('/get', async (req, res) => {
  try {
    const data = await ServicePage.find();
    res.status(200).json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE a service page by ID
router.delete('/delete/:id', async (req, res) => {
  try {
    const deleted = await ServicePage.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Service Page not found' });
    res.status(200).json({ message: 'Service Page deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
