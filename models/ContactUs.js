const mongoose = require('mongoose');

const contactUsSchema = new mongoose.Schema({
  FirstName: {
    type: String,
    required: true,
  },
  LastName: {
    type: String,
    required: true,
  },
  EmailAddress: {
    type: String,
    required: true,
  },
  PhoneNo: {
    type: String,
    required: true,
  },
  Services: {
    type: String,
    required: true,
  },
  Message: {
    type: String,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('ContactUs', contactUsSchema);
