const express = require('express');
const router = express.Router();
const ServicePage = require('../models/servicepage.model');
const multer = require('multer');
const ImageKit = require('imagekit');
require('dotenv').config();

// ImageKit Configuration
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Multer Setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST: Add a new service page
router.post('/add', upload.fields([
  { name: 'serviceImage', maxCount: 1 },
  { name: 'images' }
]), async (req, res) => {
  try {
    const { servicetitle, titleDescArray, categoryname } = req.body;

    const parsedTitleDescArray = JSON.parse(titleDescArray);
    const parsedCategoryData = JSON.parse(categoryname);

    // Upload single serviceImage
    let uploadedServiceImage = '';
    if (req.files['serviceImage'] && req.files['serviceImage'][0]) {
      const uploadServiceImage = await imagekit.upload({
        file: req.files['serviceImage'][0].buffer,
        fileName: req.files['serviceImage'][0].originalname,
      });
      uploadedServiceImage = uploadServiceImage.url;
    }

    // Upload category images
    const uploadedCategoryImages = await Promise.all(
      (req.files['images'] || []).map(file =>
        imagekit.upload({
          file: file.buffer,
          fileName: file.originalname,
        })
      )
    );

    const categorynameWithImages = parsedCategoryData.map((item, index) => ({
      image: uploadedCategoryImages[index]?.url || '',
      title: item.title,
      description: item.description,
    }));

    const servicePage = new ServicePage({
      servicetitle,
      serviceImage: uploadedServiceImage,
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

// PUT: Update a service page
router.put('/update/:id', upload.fields([
  { name: 'serviceImage', maxCount: 1 },
  { name: 'images' }
]), async (req, res) => {
  try {
    const { servicetitle, titleDescArray, categoryname } = req.body;

    const parsedTitleDescArray = JSON.parse(titleDescArray);
    const parsedCategoryData = JSON.parse(categoryname);

    let uploadedServiceImage = '';
    if (req.files['serviceImage'] && req.files['serviceImage'][0]) {
      const uploadServiceImage = await imagekit.upload({
        file: req.files['serviceImage'][0].buffer,
        fileName: req.files['serviceImage'][0].originalname,
      });
      uploadedServiceImage = uploadServiceImage.url;
    }

    let uploadedCategoryImages = [];
    if (req.files['images'] && req.files['images'].length > 0) {
      uploadedCategoryImages = await Promise.all(
        req.files['images'].map(file =>
          imagekit.upload({
            file: file.buffer,
            fileName: file.originalname,
          })
        )
      );
    }

    const categorynameWithImages = parsedCategoryData.map((item, index) => ({
      image: uploadedCategoryImages[index]?.url || item.image || '',
      title: item.title,
      description: item.description,
    }));

    const updatePayload = {
      servicetitle,
      titleDescArray: parsedTitleDescArray,
      categoryname: categorynameWithImages,
    };

    if (uploadedServiceImage) {
      updatePayload.serviceImage = uploadedServiceImage;
    }

    const updatedServicePage = await ServicePage.findByIdAndUpdate(
      req.params.id,
      updatePayload,
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

// GET: Get all service pages
router.get('/get', async (req, res) => {
  try {
    const data = await ServicePage.find();
    res.status(200).json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE: Delete service page
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
