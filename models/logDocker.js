const mongoose = require('mongoose');

const logSchema = mongoose.Schema({
    containerName: { type: String, required: true },
    subdomain: { type: String },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['stdout', 'stderr'], default: 'stdout' },
    message: { type: String, required: true }
})

module.exports = mongoose.model("Logs", logSchema);