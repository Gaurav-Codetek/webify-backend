const mongoose = require('mongoose');

const domainListSchema = mongoose.Schema({
    domainName: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
})

module.exports = domainListSchema;