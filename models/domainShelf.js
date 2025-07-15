const mongoose = require('mongoose');
const domainListSchema = require('./domainList');

const domainSchema = mongoose.Schema({
    domain: {
        type: [domainListSchema],
        required: true
    }
})

module.exports = mongoose.model("domainLists", domainSchema);