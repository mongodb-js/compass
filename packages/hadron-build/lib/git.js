/* eslint no-sync: 0 */
const Promise = require('bluebird');
const execFile = Promise.promisify(require('child_process').execFile);
const execFileSync = require('child_process').execFileSync;
const which = require('which');

const parse = (stdout) => {
  const tag = stdout.toString('utf-8').split('\n')[0];
  return tag || null;
};

/**
 * @param {String} sha
 * @param {Function} done
 * @example
 * > git.isTag('2557def1585d4ac6752f9c21fc4e9af4e41979df');
 * > { '0': null, '1': false }
 * > git.isTag('1a65be32d833f0eb5b3e3c68b15dbeff20ddcd35');
 * > { '0': null, '1': true }
 * @return {Promise}
 */
exports.isTag = (sha) => {
  return exports.getTag(sha)
    .then((tag) => tag !== null);
};

exports.isTagSync = (sha) => {
  return exports.getTagSync(sha) !== null;
};

const getExecArgs = (sha) => {
  const GIT = which.sync('git');
  const opts = {
    cwd: process.cwd(),
    env: process.env
  };

  const args = [
    'describe',
    '--exact-match',
    sha
  ];

  return [
    GIT, args, opts
  ];
};

/**
 * @param {String} sha
 * @param {Function} done
 * @example
 * > git.getTag('2557def1585d4ac6752f9c21fc4e9af4e41979df');
 * > { '0': null, '1': null }
 * > git.getGitTag('1a65be32d833f0eb5b3e3c68b15dbeff20ddcd35');
 > { '0': null, '1': 'v1.2.0-pre.0' }
 * @return {Promise}
 */
exports.getTag = (sha) => {
  return execFile.apply(null, getExecArgs(sha)).then(parse);
};

exports.getTagSync = (sha) => {
  return parse(execFileSync.apply(null, getExecArgs(sha)));
};
