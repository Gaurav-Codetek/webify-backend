const mongoose = require('mongoose');
const logSchema = require('./logs');
const buildSchema = require('./buildData');

const projectSchema = mongoose.Schema({
    prno: {
        type: Number,
        required: true
    },
    prname: {
        type: String,
        required: true
    },
    subdomainurl: {
        type: String,
        required: true
    },
    projectlogs: {
        type: [logSchema],
        required: true
    },
    buildData: {
        type: [buildSchema],
        required: true
    },
    status: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    framework: {
        type: String,
        required: true
    },
    repository:{
        type: String,
        required: true
    }
})
module.exports = projectSchema;
