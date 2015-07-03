#!/usr/bin/env node

require('events').EventEmitter.prototype._maxListeners = 100;
var path = require('path');
var server = require(path.resolve(__dirname, '../'));

server.listen(server.config.get('port'), server.config.get('hostname'), function() {
  console.log('   ');
  console.log('   scout ready to get to work');
  console.log('   open ' + server.config.get('listen'));
  console.log('   ');
});
