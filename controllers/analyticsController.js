const WebsiteAnalytics = require('../models/websiteAnalytics');
const WebsiteTraffic = require('../models/websiteTraffic');

exports.getAnalytics = async (req, res) => {
    try {
        const { metric, value, url, subdomain, userAgent } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Save core web vitals metric
        await WebsiteAnalytics.create({ metric, value, url, subdomain, userAgent });

        // Update or create traffic data for today
        const traffic = await WebsiteTraffic.findOne({ subdomain, date: today });

        if (traffic) {
            if (!traffic.uniqueIPs.includes(ip)) {
                traffic.pageviews += 1;
                traffic.uniqueIPs.push(ip);
            } else {
                traffic.pageviews += 1; // Optional: only increment if needed
            }
            await traffic.save();
        } else {
            await WebsiteTraffic.create({
                subdomain,
                date: today,
                pageviews: 1,
                uniqueIPs: [ip]
            });
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Analytics save error:", err);
        res.status(500).json({ error: "Failed to save analytics" });
    }
}