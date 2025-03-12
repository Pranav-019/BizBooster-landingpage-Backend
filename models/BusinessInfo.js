const mongoose = require('mongoose');

const businessInfoSchema = new mongoose.Schema({
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  phoneNumber: { type: String },
  city: { type: String },
  stateProvince: { type: String },
  pincodeZipcode: { type: String },
  businessModel: { type: String },
  remark: { type: String }
});

module.exports = mongoose.model('BusinessInfo', businessInfoSchema);
