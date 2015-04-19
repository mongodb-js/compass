require('events').EventEmitter.prototype._maxListeners = 100;

var server = require('./scout-server');

server.listen(server.config.get('port'), server.config.get('hostname'), function(){
  console.log('   ');
  console.log('   scout ready to get to work');
  console.log('   open ' + server.config.get('listen'));
  console.log('   ');
});

if(process.versions['atom-shell']) require('./scout-atom');

