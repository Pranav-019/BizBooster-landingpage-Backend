const mongoose = require('mongoose');

// Schema for title and description pair
const TitleDescriptionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
});

// Schema for categoryname object (image, title, description)
const CategorySchema = new mongoose.Schema({
  image: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

// Main ServicePage schema
const ServicePageSchema = new mongoose.Schema({
  servicetitle: { type: String, required: true },  // ✅ New field
  titleDescArray: [TitleDescriptionSchema],
  categoryname: [CategorySchema],
});

const ServicePage = mongoose.model('ServicePage', ServicePageSchema);
module.exports = ServicePage;
