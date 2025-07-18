const mongoose = require('mongoose');
const logSchema = require('./logs');
const buildSchema = require('./buildData');

const projectSchema = mongoose.Schema({
    prno: {
        type: Number,
        required: false
    },
    prname: {
        type: String,
        required: false
    },
    subdomainurl: {
        type: String,
        required: false
    },
    projectlogs: {
        type: [logSchema],
        required: false
    },
    buildData: {
        type: [buildSchema],
        required: false
    },
    status: {
        type: String,
        required: false
    },
    branch: {
        type: String,
        required: false
    },
    framework: {
        type: String,
        required: false
    },
    repository:{
        type: String,
        required: false
    }
})
module.exports = projectSchema;
