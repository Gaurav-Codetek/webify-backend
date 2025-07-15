const mongoose = require('mongoose');

const logSchema = mongoose.Schema({
    log:{
        type: String,
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
})

module.exports = logSchema;