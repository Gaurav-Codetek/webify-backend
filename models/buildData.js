const mongoose = require('mongoose');
const logSchema = require('./logs');

const buildSchema = mongoose.Schema({
    blno: {
        type: Number,
        required: true
    },
    blname: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    buildlogs: {
        type: [logSchema],
        required: true
    },
    deploymsg: {
        type: String,
        required: false
    },
    repository:{
        type: String,
        required: true
    },
    framework:{
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = buildSchema;