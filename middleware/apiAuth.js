const dotenv = require('dotenv');
dotenv.config();

function verifyApiKey(req, res, next) {
    const userKey = req.headers['x-api-key'];
    // console.log(userKey);
    // console.log(process.env.X_API_KEY)
    if (!userKey || userKey !== process.env.X_API_KEY) {
        return res.status(403).json({ message: "Forbidden: Invalid API Key" });
    }
    next();
}

module.exports = verifyApiKey