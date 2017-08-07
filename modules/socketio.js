let io;
const driverManager = require('./../modules/driver-manager');
const redisClient = require('./redis').client;

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

      redisClient.set(customerId, socket.id);
      //console.log(`Customer id: ${customerId} is mapped with socket id: ${socket.id}`);

      driverManager.find(lat, lon, 5000)
        .then(drivers => {
            console.log(`Found drivers for booking: `, drivers);
            drivers.forEach((driver) => {
                redisClient.get('501', function(err, driverSocketId) {
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

    socket.on('acceptJob', (msg) => {
      console.log(msg)
      socket.emit(msg.passenger_id, {
        stats: 'OK',
        msg: msg
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
