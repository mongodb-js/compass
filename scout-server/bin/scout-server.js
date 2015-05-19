#!/usr/bin/env node
require('events').EventEmitter.prototype._maxListeners = 100;

var server = require(__dirname + '/../');
server.listen(server.config.get('port'), server.config.get('hostname'), function() {
  console.log('   ');
  console.log('   scout ready to get to work');
  console.log('   open ' + server.config.get('listen'));
  console.log('   ');
});
