const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    heading: { type: String, required: true },
    image: { type: String, required: true }, // URL of the uploaded image
    features: { type: [String], required: true } // Array of bullet points
});

module.exports = mongoose.model('Item', ItemSchema);
