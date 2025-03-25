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

// POST - Create testimonial with image upload
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

// GET - All testimonials
router.get('/get', async (req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ createdAt: -1 });
        res.status(200).json(testimonials);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch testimonials' });
    }
});

// DELETE - Remove a testimonial by ID
router.delete('/delete/:id', async (req, res) => {
    try {
        const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ error: 'Testimonial not found' });
        }
        res.status(200).json({ message: 'Testimonial deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete testimonial' });
    }
});

// PATCH - Update specific fields of a testimonial by ID
router.patch('/update/:id', upload.single('image'), async (req, res) => {
    try {
        const { description, name, location, rating } = req.body;
        let updateFields = { description, name, location, rating };

        // If an image is uploaded, update the image
        if (req.file) {
            const uploadResponse = await imagekit.upload({
                file: req.file.buffer,
                fileName: `${uuidv4()}-${req.file.originalname}`,
            });
            updateFields.image = uploadResponse.url;
        }

        const updatedTestimonial = await Testimonial.findByIdAndUpdate(req.params.id, updateFields, { new: true });

        if (!updatedTestimonial) {
            return res.status(404).json({ error: 'Testimonial not found' });
        }

        res.status(200).json({ message: 'Testimonial updated successfully', updatedTestimonial });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update testimonial' });
    }
});

// PUT - Replace entire testimonial
router.put('/replace/:id', upload.single('image'), async (req, res) => {
    try {
        const { description, name, location, rating } = req.body;

        let imageUrl;
        if (req.file) {
            const uploadResponse = await imagekit.upload({
                file: req.file.buffer,
                fileName: `${uuidv4()}-${req.file.originalname}`,
            });
            imageUrl = uploadResponse.url;
        }

        const updatedTestimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            { description, name, location, rating, image: imageUrl || undefined },
            { new: true, overwrite: true }
        );

        if (!updatedTestimonial) {
            return res.status(404).json({ error: 'Testimonial not found' });
        }

        res.status(200).json({ message: 'Testimonial replaced successfully', updatedTestimonial });
    } catch (error) {
        res.status(500).json({ error: 'Failed to replace testimonial' });
    }
});

module.exports = router;
