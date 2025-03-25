const mongoose = require('mongoose');

const BoxSchema = new mongoose.Schema({
    boxNo: String,
    count: String,
    title: String,
    description: String
});

module.exports = mongoose.model('Box', BoxSchema);

//Box route
