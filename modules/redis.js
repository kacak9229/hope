const logger = require('./logger');
const redis = require("redis");
const client = redis.createClient({
    // host: global.config.redis.host || 'redis-10411.c15.us-east-1-2.ec2.cloud.redislabs.com', // For testing purposes
    // port: global.config.redis.port || 10411 //
    host: '127.0.0.1',
    port: 6379
});

const geo = require('georedis').initialize(client);

client.on('error', function (err) {
    logger.error('Error connecting to redis!', err);
});

client.on('connect', function() {
    logger.info('Connected to redis!');
});

module.exports = {
    redis: redis,
    client: client,
    geo: geo
};
