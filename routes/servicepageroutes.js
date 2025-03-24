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

// Helper function to upload files to ImageKit
const uploadToImageKit = async (file) => {
  if (!file) return null;
  try {
    const uploadResponse = await imagekit.upload({
      file: file.buffer,
      fileName: file.originalname,
    });
    return uploadResponse.url;
  } catch (error) {
    console.error('ImageKit upload error:', error);
    return null;
  }
};

// POST: Add a new service page
router.post('/add', upload.fields([
  { name: 'serviceImage', maxCount: 1 },
  { name: 'categoryImages', maxCount: 10 }
]), async (req, res) => {
  try {
    const { servicetitle, titleDescArray, categoryname } = req.body;
    
    // Parse JSON strings
    const parsedTitleDescArray = JSON.parse(titleDescArray || '[]');
    const parsedCategoryData = JSON.parse(categoryname || '[]');

    // Upload serviceImage
    const serviceImageUrl = await uploadToImageKit(req.files?.['serviceImage']?.[0]);

    // Upload category images
    const categoryImages = req.files?.['categoryImages'] || [];
    const uploadedCategoryImages = await Promise.all(
      categoryImages.map(file => uploadToImageKit(file))
    );

    // Map category data with images
    const categorynameWithImages = parsedCategoryData.map((item, index) => ({
      image: uploadedCategoryImages[index] || item.image || '',
      title: item.title || '',
      description: item.description || '',
    }));

    const servicePage = new ServicePage({
      servicetitle,
      serviceImage: serviceImageUrl || '',
      titleDescArray: parsedTitleDescArray,
      categoryname: categorynameWithImages,
    });

    await servicePage.save();
    res.status(201).json({ message: 'Service Page created successfully', data: servicePage });
  } catch (error) {
    console.error('Error in POST /add:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// PUT: Full Update
router.put('/update/:id', upload.fields([
  { name: 'serviceImage', maxCount: 1 },
  { name: 'categoryImages', maxCount: 10 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { servicetitle, titleDescArray, categoryname } = req.body;

    // Find existing service
    const existingService = await ServicePage.findById(id);
    if (!existingService) {
      return res.status(404).json({ error: 'Service Page not found' });
    }

    // Parse JSON strings
    const parsedTitleDescArray = JSON.parse(titleDescArray || '[]');
    const parsedCategoryData = JSON.parse(categoryname || '[]');

    // Handle service image update
    let serviceImageUrl = existingService.serviceImage;
    if (req.files?.['serviceImage']?.[0]) {
      serviceImageUrl = await uploadToImageKit(req.files['serviceImage'][0]);
    }

    // Handle category images update
    const existingCategoryImages = existingService.categoryname.map(item => item.image);
    const newCategoryImages = req.files?.['categoryImages'] || [];
    
    // Upload new category images
    const uploadedCategoryImages = await Promise.all(
      newCategoryImages.map(file => uploadToImageKit(file))
    );

    // Merge existing and new images
    const categorynameWithImages = parsedCategoryData.map((item, index) => {
      // Use new uploaded image if available, otherwise keep existing or use item.image
      const image = uploadedCategoryImages[index] || 
                   (item.image && item.image.startsWith('http') ? item.image : '') || 
                   existingCategoryImages[index] || '';
      
      return {
        image,
        title: item.title || '',
        description: item.description || '',
      };
    });

    const updatePayload = {
      servicetitle: servicetitle || existingService.servicetitle,
      serviceImage: serviceImageUrl,
      titleDescArray: parsedTitleDescArray,
      categoryname: categorynameWithImages,
    };

    const updatedServicePage = await ServicePage.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    );

    res.status(200).json({ 
      message: 'Service Page updated successfully', 
      data: updatedServicePage 
    });
  } catch (error) {
    console.error('Error in PUT /update:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
});

// PATCH: Partial Update - Single field or array item
router.patch('/update/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { field, index, value } = req.body;

    const servicePage = await ServicePage.findById(id);
    if (!servicePage) {
      return res.status(404).json({ error: 'Service Page not found' });
    }

    // Handle image upload for category
    if (req.file && field === 'categoryname' && index !== undefined) {
      const imageUrl = await uploadToImageKit(req.file);
      if (!servicePage.categoryname[index]) {
        servicePage.categoryname[index] = { image: '', title: '', description: '' };
      }
      servicePage.categoryname[index].image = imageUrl || '';
    }
    // Handle regular field updates
    else if (field && value !== undefined) {
      // Handle array updates
      if (index !== undefined) {
        if (!servicePage[field]) servicePage[field] = [];
        if (!servicePage[field][index]) {
          if (field === 'titleDescArray') {
            servicePage[field][index] = { title: '', description: '' };
          } else if (field === 'categoryname') {
            servicePage[field][index] = { image: '', title: '', description: '' };
          } else {
            servicePage[field][index] = '';
          }
        }
        
        if (typeof servicePage[field][index] === 'object') {
          // Handle nested updates (e.g., titleDescArray[0].title)
          const subFields = Object.keys(value);
          subFields.forEach(subField => {
            servicePage[field][index][subField] = value[subField];
          });
        } else {
          servicePage[field][index] = value;
        }
      } 
      // Handle direct field updates
      else {
        servicePage[field] = value;
      }
    }

    await servicePage.save();
    res.status(200).json({ 
      message: 'Service Page updated successfully', 
      data: servicePage 
    });
  } catch (error) {
    console.error('Error in PATCH /update:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
});

// GET: Get all service pages
router.get('/get', async (req, res) => {
  try {
    const data = await ServicePage.find();
    res.status(200).json({ data });
  } catch (error) {
    console.error('Error in GET /get:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE: Delete service page
router.delete('/delete/:id', async (req, res) => {
  try {
    const deleted = await ServicePage.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Service Page not found' });
    }
    res.status(200).json({ message: 'Service Page deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /delete:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;