const mongoose = require('mongoose');
const logSchema = require('./logs');
const projectSchema = require('./project');

const masterSchema = new mongoose.Schema({
    gitId: {
        type: String,
        required: true
    },
    gitEmail:{
        type: String,
        required: true
    },
    gitUID:{
        type: String,
        required: true
    },
    avatar:{
        type: String,
        required:false,
    },
    systemlogs: {
        type: [logSchema],
        required: true
    },
    projects: {
        type: [projectSchema],
        required: true
    }
})

module.exports = mongoose.model('webifyRecords', masterSchema);