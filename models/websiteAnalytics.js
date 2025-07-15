// models/WebsiteAnalytics.js
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  subdomain: { type: String, required: true },
  metric: { type: String, required: true }, // e.g., LCP, FID, etc.
  value: Number,
  url: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WebsiteAnalytics', analyticsSchema);
