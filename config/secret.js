module.exports = {
  database: process.env.DATABASE || 'mongodb://naufal:abc123@ds153352.mlab.com:53352/newco', // URL will be change soon
  port: process.env.PORT || 3000,
  secret: process.env.SECRET || 'Naufal888**@#@###$$$%%199230',
  logging: {
    level: 'debug'
  }
};
