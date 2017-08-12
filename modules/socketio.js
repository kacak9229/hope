let io;
const driverManager = require('./../modules/driver-manager');
const redisClient = require('./redis').client;

function handleBooking(customerId) {
    console.log('BOOKING: ', customerId);
    redisClient.smembers(customerId, function(err, reply) {
        console.log('Job info ==> ', reply);
    });
}

function connection(socket) {
    console.log('total connections: ', io.engine.clientsCount);

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
      console.log('ACCPETED JOB: ', job);

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

    io.sockets.on('connection', connection);

    return io;
};
