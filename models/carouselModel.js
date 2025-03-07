const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  images: {
    type: [String], // Array of image URLs
    required: true,
  },
}, { timestamps: true });

const Design = mongoose.model('Design', designSchema);
module.exports = Design;