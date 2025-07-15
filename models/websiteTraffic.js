// models/WebsiteTraffic.js
const mongoose = require('mongoose');

const trafficSchema = new mongoose.Schema({
  subdomain: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  pageviews: { type: Number, default: 0 },
  uniqueIPs: [{ type: String }] // To avoid counting the same IP twice per day
});

module.exports = mongoose.model('WebsiteTraffic', trafficSchema);
