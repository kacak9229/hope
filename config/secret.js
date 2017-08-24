module.exports = {
  database: process.env.DATABASE || 'mongodb://naufal:abc123@ds153352.mlab.com:53352/newco', // URL will be change soon
  // database: process.env.DATABASE || 'mongodb://localhost/blink',
  port: process.env.PORT || 3000,
  secret: process.env.SECRET || 'Naufal888**@#@###$$$%%199230',
  logging: {
    level: 'debug'
  },
  redis: {
    host: 'redis-10411.c15.us-east-1-2.ec2.cloud.redislabs.com',
    port: 10411
  }
};
