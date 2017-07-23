const logger = require('winston');
logger.level = global.config.logging.level || 'debug';

module.exports = logger;