const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    sample: String
});

// module.exports = mongoose.model('webifyones', userSchema);