var fs = require('fs');
var format = require('util').format;
var spawn = require('child_process').spawn;
var which = require('which');
var debug = require('debug')('scout:tasks:run');

/**
 * Use me when you want to run an external command instead
 * of using `child_process` directly because I'll handle
 * lots of platform edge cases for you and provide
 * nice debugging output when things go wrong!
 *
 * @example
 *  var run = require('./tasks/run');
 *  var args = ['--verify', require('./tasks/darwin').APP_PATH];
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

  getBinPath(cmd, function(err, bin) {
    if (err) return fn(err);

    debug('running %j', {
      cmd: cmd,
      args: args,
      opts: opts
    });
    var output = [];

    var proc = spawn(bin, args, opts);
    proc.stdout.on('data', function(buf) {
      debug('  %s> %s', cmd, buf.toString('utf-8'));
      output.push(buf);
    });
    proc.stderr.on('data', function(buf) {
      debug('  %s> %s', cmd, buf.toString('utf-8'));
      output.push(buf);
    });

    proc.on('exit', function(code) {
      if (code !== 0) {
        debug('command failed! %j', {
          cmd: cmd,
          bin: bin,
          args: args,
          opts: opts,
          code: code
        });
        fn(new Error('Command failed!  '
          + 'Please try again with debugging enabled.'));
        return;
      }
      debug('completed! %j', {
        cmd: cmd,
        bin: bin,
        args: args,
        opts: opts,
        code: code
      });

      fn(null, Buffer.concat(output).toString('utf-8'));
    });
  });
}

/**
 * Gets the absolute path for a `cmd`.
 * @param {String} cmd - e.g. `codesign`.
 * @param {Function} fn - Callback which receives `(err, binPath)`.
 * @return {void}
 */
function getBinPath(cmd, fn) {
  which(cmd, function(err, bin) {
    if (err) return fn(err);

    fs.exists(bin, function(exists) {
      if (!exists) {
        return fn(new Error(format(
          'Expected file for `%s` does not exist at `%s`',
          cmd, bin)));
      }
      fn(null, bin);
    });
  });
}

module.exports = run;
