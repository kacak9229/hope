const logger = require('./logger');
const redis = require("redis");
const client = redis.createClient();

client.on('error', function (err) {
    logger.error('Error connecting to redis!', err);
});

client.on('connect', function() {
    logger.error('Connected to redis!');
});