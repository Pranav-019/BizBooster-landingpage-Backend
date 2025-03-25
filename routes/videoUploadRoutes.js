const express = require('express');
const router = express.Router();
const VideoUpload = require('../models/VideoUpload');
const multer = require('multer');
const ImageKit = require('imagekit');
const { v4: uuidv4 } = require('uuid');

// ImageKit config
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Multer config (memory storage, no local files)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST — Upload video
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Upload video to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer,
      fileName: `${uuidv4()}-${req.file.originalname}`,
      useUniqueFileName: true,
      folder: '/videos', // Optional folder organization
    });

    // Save URL and fileId to DB
    const newVideo = new VideoUpload({
      video: uploadResponse.url,
      fileId: uploadResponse.fileId, // Store fileId to enable deletion
    });

    await newVideo.save();
    res.status(201).json({ message: 'Video uploaded successfully', video: newVideo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// GET — Fetch all uploaded videos
router.get('/get', async (req, res) => {
  try {
    const videos = await VideoUpload.find().sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// DELETE — Remove a video by ID
router.delete('/delete/:id', async (req, res) => {
  try {
    const video = await VideoUpload.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Delete from ImageKit using fileId
    await imagekit.deleteFile(video.fileId);

    // Delete from database
    await VideoUpload.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

module.exports = router;
