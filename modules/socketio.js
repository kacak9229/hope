let io;
const config = require('../config/secret');
const driverManager = require('./../modules/driver-manager');
const customerManager = require('../modules/customer-manager');
const redisClient = require('./redis').client;
const socketioJwt   = require("socketio-jwt");
const Q = require('q');
const Job = require('../models/job');
const JOB_EXPIRES_IN = 3600 * 5; //IN SECS

function handleBooking(customerId) {
    console.log('BOOKING: ', customerId);
    redisClient.smembers(`j-${customerId}`, function(err, driverIds) {
        if(err) {
            console.error('!!! ERROR GETTING SMEMBERS', err);
        }
        console.log('Job info ==> ', driverIds);

        if(driverIds.length > 0) {
            //TODO: choose the nearest one
            let driverId = driverIds[0];
            console.log('Confirming job to driver: ', driverId);

            redisClient.get(driverId, function(err, driverSocketId) {
                redisClient.get(`job-${customerId}`, (err, j) => {
                    io.to(driverSocketId).emit('job', {
                        customerId: customerId,
                        job: JSON.parse(j)
                    });

                    //Extend the job expiry
                    //Setting to 5 hours for now.
                    //TODO: each job may have diferent expiry based on distance and traffic
                    redisClient.expire(`job-${customerId}`, JOB_EXPIRES_IN);

                    //confirm customer
                    getDriverInfo(driverId)
                        .then(function(d) {
                            console.log('!!!!!!!!! ====>', d);

                            redisClient.get(`${customerId}`, function(err, customerSockerId) {
                                let jInfo = JSON.parse(j);
                                jInfo.driverInfo = d;

                                io.to(customerSockerId).emit('bookResponse', [jInfo]);
                                console.info('!!! bookResponse: ', jInfo);
                            });
                        })
                        .catch(function(err) {
                            console.error('Error getting driver info', err);
                        })
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

                            //Save the job for driver as well
                            //TODO: saving a job for customer and driver should be encapsulated in a function
                            redisClient.set(`job-${driverId}`, j);
                            redisClient.expire(`job-${driverId}`, JOB_EXPIRES_IN);

                            const blinkJob = JSON.parse(j);

                            let job = new Job();
                            job.passenger = users[0]._id;
                            job.driver = users[1]._id;

                            /*
                             { secondLong: 101.7131072,
                             user_id: '1958609537756426',
                             lat: 3.17140845682656,
                             price: 12.078,
                             long: 101.6667575785114,
                             secondLat: 3.148482 }
                             */

                            job.source_location.address = 'sample source address';
                            job.source_location.coordinates.lat = blinkJob.lat;
                            job.source_location.coordinates.long = blinkJob.long;

                            job.to_location.address = 'Sample destination';
                            job.to_location.coordinates.lat = blinkJob.secondLat;
                            job.to_location.coordinates.long = blinkJob.secondLong;

                            job.total_price = parseFloat(blinkJob.price).toFixed(2);

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

                //Delete the job for customer since there is no driver
                redisClient.del(`job-${customerId}`, (err, reply) => {
                    console.log(`Customer job deleted: `, err, reply);
                });
            });
        }
    });
}

function endJob(customerId, driverId) {
    const endDriver = Q.ninvoke(redisClient, "del", `job-${driverId}`);
    const endCustomer = Q.ninvoke(redisClient, "del", `job-${customerId}`);

    Q.all([endCustomer, endDriver])
        .then((results) => {
            console.log('ENDING JOBS Customer: ', results[0]);
            console.log('SUCCESS ENDING Driver: ', results[1]);
        })
        .catch((err) => {
            console.error('Error ending jobs: ', err);
        });
}

function setDriverInfo(driverInfo) {
    redisClient.set(`driverInfo_${driverInfo.driver_id}`, JSON.stringify(driverInfo), function (err, reply) {
        if(err) console.error(err);
        else {
            /*
            getDriverInfo(driverInfo.driver_id)
                .then(function(d) {
                    console.log('!!! RETRIVED driver info:', d.driver_id);
                })
                .catch(function(err) {
                  console.error('Error getting driver info', err);
                })
            */
        }
    });
}

function getDriverInfo(driverId) {
    const deferred = Q.defer();

    redisClient.get(`driverInfo_${driverId}`, (err, dInfo) => {
        console.log('Got driver info =====> ', err, dInfo);

        if (err) {
            console.error('Error getting driver info', err);
            deferred.reject(new Error(err));
        }
        else {
            if(dInfo) {
                deferred.resolve(JSON.parse(dInfo));
            }
            else {
                const msg = `Could not find driver info for Driver Id: ${driverId}`;
                console.error(msg);
                deferred.reject(new Error(msg));
            }
        }
    });

    return deferred.promise;
}

function connection(socket) {
    console.log('total connections: ', io.engine.clientsCount);
    console.log(socket.decoded_token._doc);

    const facebookId = socket.decoded_token._doc.facebookId;
    console.log(`Facebook id is: ${facebookId}`);

    //Check if user has an existing job in progress
    redisClient.get(`job-${facebookId}`, (err, j) => {
        console.log('job status =====> ', err, j);
        if (err) {
            console.log('Error finding job in redis', err);
        } else {
            if(j) {
                console.log('job info is this: ', j);
                /*getDriverInfo(driverId)
                    .then(function(d) {

                    })
                    .catch(function(err) {
                        console.error('Error getting driver info', err);
                    });*/


                socket.emit('job', JSON.parse(j));
            }
        }
    });

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

    //Sent by customer
    socket.on('ping', (msg) => {
        let customerId = msg.customer_id + '';
        let lat = msg.lat;
        let lon = msg.long;

        console.log('ping is: ', msg);

        redisClient.set(customerId, socket.id);
    });

    //driverInfo is triggered on server has established connection with the driver
    socket.on('driverInfo', (driverInfo) => {
        console.log('!!! got driver info: ', driverInfo);
        setDriverInfo(driverInfo);
    });

    socket.on('book', (msg) => {
      let customerId = msg.user_id;
      let lat = msg.lat;
      let lon = msg.long;

      console.info(`received booking: `, msg);

        /**
         * Set the job for customer
         * One customer can have job at a single point of time
         * Job will have an expiry.
         * If a driver is assigned to the job then n hours
         * If no drivers found then delete the job
         */

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
    });

    socket.on('acceptJob', (job) => {
      const customerId = job.customer_id;
      console.log('ACCEPTED JOB: ', job);

      redisClient.sadd([`j-${customerId}`, job.driver_id], function(err, reply) {
        console.log(`Driver added to accept queue: ${customerId}`);
        if(err) console.error(err);
        else {
            console.info('!!! SUCCESSFULLY ADDED DRIVER TO JOB QUEUE: ', job.driver_id, reply);
        }
      });
    });

    socket.on('endJob', (job) => {
        const customerId = job.customer_id;
        const driverId = job.driver_id;
        endJob(customerId, driverId);
        redisClient.get(`${customerId}`, function(err, customerSocketId) {
            console.log('sending pickup to customer ----> ', customerSocketId);
            io.to(customerSocketId).emit('endJob', job);
        });
    });

    socket.on('pickup', (job) => {
        const customerId = job.customer_id;

        console.log('!!! PICKUP =>', job);

        redisClient.get(`${customerId}`, function(err, customerSocketId) {
            console.log('sending pickup to customer ----> ', customerSocketId);
            io.to(customerSocketId).emit('pickup', job);
        });
    });

    socket.on('dropoff', (job) => {
        const customerId = job.customer_id;

        redisClient.get(`${customerId}`, function(err, customerSocketId) {
            io.to(customerSocketId).emit('dropoff', job);
        });
    });

    socket.on('cancel', (job) => {
        //if driver or customer cancels
        const customerId = job.customer_id;
        const driverId = job.driver_id;
        console.log('Cancelled job: ', job);

        endJob(customerId, driverId);

        //Notify both driver and customer
        redisClient.get(customerId, function(err, customerSocketId) {
            io.to(customerSocketId).emit('cancel', job);
        });

        redisClient.get(driverId, function(err, driverSocketId) {
            io.to(driverSocketId).emit('cancel', job);
        });
    });

    socket.on('disconnect', () => {
        console.log('Disconnected', socket.id);
        console.log('total connections: ', io.engine.clientsCount);

        //TODO: delete id to socket.id mappings
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
