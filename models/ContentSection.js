const mongoose = require('mongoose');

const contentItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

const contentSectionSchema = new mongoose.Schema({
  Heading: {
    type: String,
    required: true
  },
  Subheading: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  content: [contentItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('ContentSection', contentSectionSchema);
