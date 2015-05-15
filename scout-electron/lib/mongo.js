var path = require('path');
process.env.PATH = path.resolve(__dirname + '/../bin:') + process.env.PATH;

var mkdirp = require('mkdirp');
var debug = require('debug')('scout-electron:mongo');
var proc = require('child_process');

var untildify = require('untildify');

var mongo;

module.exports.start = function(done) {
  debug('starting bundled mongodb on port 27777');
  var bin = path.resolve(__dirname + '/../../bin/mongod');
  var dbpath = untildify('~/.mongodb/scout-demo');
  mkdirp(dbpath, function() {
    mongo = proc.spawn(bin, ['--port', '27777', '--dbpath', dbpath, '--bind_ip', '127.0.0.1']);
    mongo.stderr.pipe(process.stderr);
    mongo.stdout.pipe(process.stdout);
    setTimeout(function() {
      debug('Standalone ready on localhost:27777!');
      require('../../scout-data/bin/scout-data.js');
      done();
    }, 1000);
  });
};

module.exports.stop = function(done) {
  debug('stopping bundled mongodb...');
  mongo.kill();
  process.nextTick(done);
};
