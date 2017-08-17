let io;
const config = require('../config/secret');
const driverManager = require('./../modules/driver-manager');
const redisClient = require('./redis').client;
const socketioJwt   = require("socketio-jwt");

function handleBooking(customerId) {
    console.log('BOOKING: ', customerId);
    redisClient.smembers(customerId, function(err, driverIds) {
        console.log('Job info ==> ', driverIds);

        if(driverIds.length > 0) {
            //TODO: choose the nearest one
            let driverId = driverIds[0];
            console.log('Confirming job to driver: ', driverId);

            redisClient.get(driverId, function(err, driverSocketId) {
                io.to(driverSocketId).emit('job', {
                    customerId: customerId
                });

                //confirm customer
                redisClient.get(`sock-${customerId}`, function(customerSockerId) {
                    io.to(customerSockerId).emit('bookResponse', [driverId]);
                });
            });
        } else {
            console.info(`No drivers were found`);
            redisClient.get(`sock-${customerId}`, function(customerSockerId) {
                io.to(customerSockerId).emit('bookResponse', []);
            });
        }
    });
}

function connection(socket) {
    console.log('total connections: ', io.engine.clientsCount);
    // console.log(socket.decoded_token._doc.email);
    console.log(socket.decoded_token._doc);

    socket.on('message', (msg) => {
        socket.emit('message', {
            stats: 'OK',
            msg: msg
        });
    });

    socket.on('trace', (msg) => {
      let driverId = msg.driver_id + '';
      let lat = msg.lat;
      let lon = msg.long;

      console.log('trace is: ', msg);

      redisClient.set(driverId, socket.id);
      //console.log(`Driver id: ${driverId} is mapped with socket id: ${socket.id} with data: `, msg);

      driverManager.trace(driverId, lat, lon)
          .then(reply => {
              res.json({
                  status: 'OK',
                  reply: reply
              });
          })
          .catch(err => {
              res.json({
                  status: 'Failed',
                  err: err
              });
          });
    });

    socket.on('auth', (msg) => {
        socket.emit('message', {
            stats: 'OK',
            msg: msg
        });
    });


    socket.on('book', (msg) => {
      let customerId = msg.user_id;
      let lat = msg.lat;
      let lon = msg.long;

      console.info(`received booking: `, msg);

      redisClient.set(`sock-${customerId}`, socket.id);
      //console.log(`Customer id: ${customerId} is mapped with socket id: ${socket.id}`);

      redisClient.del(customerId, function(err, reply) {
         console.log(`Set deleted: ${customerId}`);
      });

      setTimeout(function() {
          handleBooking(customerId);
      }, 10000);

      driverManager.find(lat, lon, 5000)
        .then(drivers => {
            console.log(`Found drivers for booking: `, drivers);
            //TODO: Make it q.all promise based instead
            drivers.forEach((driver) => {
                console.log('Sending case to driver: ', driver);

                redisClient.get(driver.key, function(err, driverSocketId) {
                    io.to(driverSocketId).emit('toAllDrivers', msg);
                });
            });
        })
        .catch(err => {
          res.json({
            status: 'Failed',
            err: err
          });
        });

      /*
      socket.broadcast.emit('toAllDrivers', {
        stats: 'OK',
        msg: msg
      });
      */
    });

    socket.on('acceptJob', (job) => {
      const customerId = job.customer_id;
      console.log('ACCEPTED JOB: ', job);

      redisClient.sadd([customerId, job.driver_id], function(err, reply) {
        console.log(`Driver added to accept queue: ${customerId}`);
      });
    });

    socket.on('disconnect', () => {
        console.log('Disconnected', socket.id);
        console.log('total connections: ', io.engine.clientsCount);
    });
}

module.exports = function(server=null) {
    if(!io && !server) {
        throw 'Server is not set yet!';
    }

    if(!io) {
        io = require('socket.io')(server);
    }

    // io.sockets.on('connection', connection);
    io.sockets.on('connection', socketioJwt.authorize({
      secret: config.secret,
      timeout: 20000 // 15 seconds to send the authentication message
    })).on('authenticated', connection)

    return io;
};
