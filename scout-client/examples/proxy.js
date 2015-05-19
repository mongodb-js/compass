// window.mongoscopeClient.configure({endpoint: 'http://localhost:9092'});
// window.mongoscope = window.mongoscopeClient();
var $log = $('.container'),
  i = 0;

var log = function(msg){
  $log.prepend('<code><pre>' + i + '. ' + msg + '</pre></code>');
  i++;
};

var io = window.socket.ioClient('http://localhost:9092');
io.on('lowfive', function(){
  log('[ <---] lowfive: ' + JSON.stringify(arguments));
});

log('[ .... ] connecting');

io.on('token:error', function(data){
  log('[ <--- ] token error: ' + JSON.stringify(data));
})
.on('token:data', function(data){
  log('[ <--- ] token created! ' + JSON.stringify(data));
});

io.on('connect', function(){
  log('[ <--- ] connect!');
  log('[ ---> ] highfive');
  io.emit('highfive', {hi: 1});

  log('[ ---> ] token:create {mongodb: localhost:27017}');
  io.emit('token:create', {mongodb: 'localhost:27017'});
})
.on('reconnect_failed', function(){
  log('[ !!!! ] reconnect attempt failed! ' + JSON.stringify(arguments));
})
.on('reconnecting', function(){
  log('[ .... ] reconnecting');
})
.on('disconnect', function(){
  log('[ <--- ] disconnect!');
});
