const redis = require('redis');
require('dotenv').config();


const redisClient =  redis.createClient({
    password:process.env.REDIS_PASSWORD,
    socket:{
        host: process.env.REDIS_HOST,
        port: 14635
    }
//   url: "redis://default:iFEQBhF0TmXnkXon6flOoIYMgCddPS3t@:14635"
});

module.exports = redisClient;
