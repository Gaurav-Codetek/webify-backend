const mongoose = require('mongoose');
const logSchema = require('./logs');
const projectSchema = require('./project');

const masterSchema = new mongoose.Schema({
    gitId: {
        type: String,
        required: false
    },
    gitEmail:{
        type: String,
        required: false
    },
    gitUID:{
        type: String,
        required: false
    },
    avatar:{
        type: String,
        required:false,
    },
    systemlogs: {
        type: [logSchema],
        required: false
    },
    projects: {
        type: [projectSchema],
        required: false
    },
    installationId:{
        type: String,
        required: false
    }
})

module.exports = mongoose.model('webifyRecords', masterSchema);