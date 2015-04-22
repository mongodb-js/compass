require('events').EventEmitter.prototype._maxListeners = 100;

if(process.env.NODE_ENV !== 'development'){
  var server = require('./scout-server');

  server.listen(server.config.get('port'), server.config.get('hostname'), function(){
    console.log('   ');
    console.log('   scout ready to get to work');
    console.log('   open ' + server.config.get('listen'));
    console.log('   ');
  });
}
require('./scout-atom');
