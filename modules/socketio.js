let io;

function connection(socket) {
    console.log('total connections: ', io.engine.clientsCount);

    socket.on('message', (msg) => {
        socket.emit('message', {
            stats: 'OK',
            msg: msg
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
