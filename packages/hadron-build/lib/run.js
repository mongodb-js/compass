'use strict';
var { promisify } = require('util');
var spawn = require('child_process').spawn;
var debug = require('debug')('hadron-build:run');

/**
 * Use me when you want to run an external command instead
 * of using `child_process` directly because I'll handle
 * lots of platform edge cases for you and provide
 * nice debugging output when things go wrong!
 *
 * @example
 *  var args = ['--verify', process.env.APP_PATH];
 *  run('codesign', args, function(err){
 *    if(err){
 *      console.error('codesign verification failed!');
 *      process.exit(1);
 *    }
 *    console.log('codesign verification succeeded!');
 *  });
 *
 * @param {String} cmd - The bin name of your command, e.g. `grep`.
 * @param {Array} [args] - Arguments to pass to the command [Default `[]`].
 * @param {Object} [opts] - Options to pass to `child_process.spawn` [Default `{}`].
 * @param {Function} fn - Callback which recieves `(err, output)`.
 */
function run(cmd, args, opts, fn) {
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  if (typeof args === 'function') {
    fn = args;
    args = [];
    opts = {};
  }

  debug('running', { cmd, args });

  var output = [];
  var proc = spawn(cmd, args, opts);
  proc.stdout.on('data', function(buf) {
    buf.toString('utf-8').split('\n').map(function(line) {
      debug('  %s> %s', cmd, line);
    });
    output.push(buf);
  });
  proc.stderr.on('data', function(buf) {
    buf.toString('utf-8').split('\n').map(function(line) {
      debug('  %s> %s', cmd, line);
    });
    output.push(buf);
  });

  proc.on('exit', function(code) {
    if (code !== 0) {
      debug('command failed!', {
        cmd: cmd,
        output: Buffer.concat(output).toString('utf-8')
      });
      fn(new Error('Command failed!  '
        + 'Please try again with debugging enabled.'), Buffer.concat(output).toString('utf-8'));
      return;
    }
    debug('completed! %j', {
      cmd: cmd
    });

    fn(null, Buffer.concat(output).toString('utf-8'));
  });
}

run.async = promisify(run);

module.exports = run;
