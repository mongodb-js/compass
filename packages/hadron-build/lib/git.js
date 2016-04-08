const path = require('path');
const execFile = require('child_process').execFile;
const which = require('which');

/**
 * @param {String} sha
 * @param {Function} done
 * @example
 * > git.isTag('2557def1585d4ac6752f9c21fc4e9af4e41979df', function(){console.log(arguments);});
 * > { '0': null, '1': false }
 * > git.isTag('1a65be32d833f0eb5b3e3c68b15dbeff20ddcd35', function(){console.log(arguments);});
 * > { '0': null, '1': true }
 */
exports.isTag = function(sha, done) {
  exports.getTag(sha, function(err, tag) {
    if (err) {
      return done(err);
    }
    done(null, tag !== null);
  });
};

/**
 * @param {String} sha
 * @param {Function} done
 * @example
 * > git.getTag('2557def1585d4ac6752f9c21fc4e9af4e41979df', function(){console.log(arguments);});
 * > { '0': null, '1': null }
 * > git.getGitTag('1a65be32d833f0eb5b3e3c68b15dbeff20ddcd35', function(){console.log(arguments);});
 > { '0': null, '1': 'v1.2.0-pre.0' }
 */
exports.getTag = function(sha, done) {
  const GIT = which.sync('git');
  const opts = {
    cwd: path.join(__dirname, '..'),
    env: process.env
  };

  const args = [
    'describe',
    '--exact-match',
    sha
  ];
  execFile(GIT, args, opts, function(err, stdout, stderr) {
    if (!err) {
      const tag = stdout.toString('utf-8').split('\n')[0];
      done(null, tag);
      return;
    }
    if (stderr.toString('utf-8').indexOf('no tag exactly matches') > -1) {
      done(null, null);
      return;
    }
    done(err);
  });
};
