let io;
const driverManager = require('./../modules/driver-manager');

function connection(socket) {
    console.log('total connections: ', io.engine.clientsCount);

    socket.on('message', (msg) => {
        socket.emit('message', {
            stats: 'OK',
            msg: msg
        });
    });

    socket.on('trace', (msg) => {
      let driverId = socket.decoded_token._id// Driver Id
      let lat = msg.lat;
      let lon = msg.lon;

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
      console.log(msg)
      socket.broadcast.emit('toAllDrivers', {
        stats: 'OK',
        msg: msg
      });
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
