const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  phoneNumber: { type: String },
  email: { type: String },
  address: { type: String },
  module: { type: String },
  message: { type: String },
  fileUrl: { type: String }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

module.exports = mongoose.model('Service', serviceSchema);
