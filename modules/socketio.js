let io;
const config = require('../config/secret');
const driverManager = require('./../modules/driver-manager');
const customerManager = require('../modules/customer-manager');
const redisClient = require('./redis').client;
const socketioJwt   = require("socketio-jwt");
const Q = require('q');
const Job = require('../models/job');

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
                redisClient.get(`sock-${customerId}`, function(err, customerSockerId) {
                    io.to(customerSockerId).emit('bookResponse', [driverId]);
                });

                Q.all([
                    customerManager.findByFacebookId(customerId),
                    driverManager.findByFacebookId(driverId)
                ])
                .then(function(users) {
                    console.log('Found customer and driver in mongo: ', users);
                    //Save

                    redisClient.get(`job-${customerId}`, (err, j) => {
                        if(err) {
                            console.log('Error finding job in redis', err);
                        }
                        else {
                            console.log('Found job in redis -->', j);

                            let job = new Job();
                            job.passenger = users[0]._id;
                            job.driver = users[1]._id;

                            job.source_location.address = 'sample source address';
                            job.source_location.coordinates.lat = 101;
                            job.source_location.coordinates.long = 101;

                            job.to_location.address = 'Sample destination';
                            job.to_location.coordinates.lat = 201;
                            job.to_location.coordinates.long = 201;

                            job.save((err) => {
                                if(err) {
                                    console.error('ERROR saving job in Mongo: ', err);
                                }
                                else {
                                    console.log('SUCCESSFULLY saved job in Mongo!');
                                }
                            });
                        }
                    });
                })
                .catch((err) => {
                    console.error('Error finding customer and driver from DB', err);
                });
            });
        } else {
            console.info(`No drivers were found`);
            redisClient.get(`sock-${customerId}`, function(err, customerSockerId) {
                io.to(customerSockerId).emit('bookResponse', []);
            });
        }
    });
}

function connection(socket) {
    console.log('total connections: ', io.engine.clientsCount);
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
      //redisClient.expire(driverId, 10);

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
      redisClient.set(`job-${customerId}`, JSON.stringify(msg));

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

    // io.sockets
    //     .on('connection', socketioJwt.authorize({
    //         secret: config.secret,
    //         timeout: 15000 // 15 seconds to send the authentication message
    //     })).on('authenticated', function(socket) {
    //         console.log("Im here actually!");
    //         connection(socket);
    //     });


    io.sockets.on('connection', connection);

    return io;
};
