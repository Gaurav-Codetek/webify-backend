const mongoose = require('mongoose');
const logSchema = require('./logs');

const buildSchema = mongoose.Schema({
    blno: {
        type: Number,
        required: false
    },
    blname: {
        type: String,
        required: false
    },
    url: {
        type: String,
        required: false
    },
    buildlogs: {
        type: [logSchema],
        required: false
    },
    deploymsg: {
        type: String,
        required: false
    },
    repository:{
        type: String,
        required: false
    },
    framework:{
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = buildSchema;