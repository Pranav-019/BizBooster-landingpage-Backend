const mongoose = require('mongoose');

const videoUploadSchema = new mongoose.Schema({
  video: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('VideoUpload', videoUploadSchema);
