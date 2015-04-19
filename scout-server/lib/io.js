var app = require('./index.js');
var io = module.exports = require('socket.io')(app.server);
var config = require('mongoscope-config');

io.use(require('socketio-jwt').authorize({
  secret: config.get('token:secret').toString('utf-8'),
  handshake: true
}));

io.on('connection', function (socket) {
  console.log('hello connection!', socket.decoded_token);
});
