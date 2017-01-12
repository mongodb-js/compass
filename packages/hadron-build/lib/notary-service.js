/**
 * A node.js client for the [notary-service](https://github.com/10gen/notary-service).
 *
 * Parameters for the notary service are passed in as environment variables:
 *
 *  - `NOTARY_SIGNING_KEY` The name of the key to use for signing
 *  - `NOTARY_SIGNING_COMMENT` The comment to enter into the notary log for this signing operation
 *  - `NOTARY_AUTH_TOKEN` The password for using the selected signing key
 *  - `NOTARY_URL` The URL of the notary service
 */

const fs = require('fs');
const crypto = require('crypto');
const pbkdf2 = require('pbkdf2');
const _ = require('lodash');
const request = require('superagent');
const debug = require('debug')('hadron-build:notary-service');

function getSalt(secret) {
  const salt = _.chain(secret)
    .split('')
    .reverse()
    .join('')
    .value();
  return salt;
}

function generateAuthToken(secret, dateStr) {
  const salt = getSalt(secret);
  if (!dateStr) {
    dateStr = new Date().toISOString();
  }

  /* eslint no-sync: 0 */
  const derivedKey = pbkdf2.pbkdf2Sync(secret, salt, 1000, 16, 'sha1');
  const signedData = crypto.createHmac('sha1', derivedKey);
  signedData.update(dateStr);
  return `${signedData.digest('hex')}${dateStr}`;
}

function download(dest, url, done) {
  debug('downloading %s to %s...', url, dest);
  request.get(url)
    .stream()
    .pipe(fs.createWriteStream(dest))
    .on('error', function(err) {
      debug('download error:', err);
      done(err);
    })
    .on('close', function() {
      debug('download completed successfully!');
      done();
    });
}

function sign(src, done) {
  const url = `${process.env.NOTARY_URL}/api/sign`;
  const key = process.env.NOTARY_SIGNING_KEY;
  const comment = process.env.NOTARY_SIGNING_COMMENT;
  const authToken = generateAuthToken(process.env.NOTARY_AUTH_TOKEN);

  debug('attempting to sign %s via notary-service', src);
  debug('  - src', src);
  debug('  - url', url);
  debug('  - key', key);
  debug('  - comment', comment);
  debug('  - authToken', authToken);

  request.post(url)
    .field('key', key)
    .field('comment', comment)
    .field('auth_token', authToken)
    .attach('file', src)
    .end(function(err, res) {
      if (err) {
        debug('request error:', err);
        return done(err);
      }

      if (!res.body.permalink) {
        debug('signing service did not return a permalink');
        return done(new Error('Signing service did not return a permalink'));
      }

      debug('Success!', res.body);

      const downloadUrl = `${process.env.NOTARY_URL}/${res.body.permalink}`;
      download(src, downloadUrl, done);
    });
}

module.exports = function(src, done) {
  if (!process.env.NOTARY_URL) {
    debug('NOTARY_URL environment variable not set. skipping.');
    return done();
  }

  [
    'NOTARY_SIGNING_KEY',
    'NOTARY_SIGNING_COMMENT',
    'NOTARY_AUTH_TOKEN',
    'NOTARY_URL'
  ].every(function(k) {
    if (!process.env[k]) {
      done(new TypeError(`Must set ${k} environment variable`));
      return false;
    }
    return true;
  });

  sign(src, done);
};

module.exports.getSalt = getSalt;
module.exports.generateAuthToken = generateAuthToken;
module.exports.download = download;
module.exports.sign = sign;

const execa = require('execa');
const pify = require('pify');

module.exports.deb = function deb(src) {
  if (!process.env.NOTARY_URL) {
    debug('NOTARY_URL environment variable not set. skipping.');
    return Promise.resolve();
  }

  const psign = pify(sign);
  // Take an existing .deb and unpack it:
  return execa('ar', ['x', src]).then(() => {
    // Concatenate its contents (the order is important), and output to a temp file:
    // run(`cat debian-binary control.tar.gz data.tar.xz > dist/combined-contents`);
    var tmp = fs.createWriteStream('combined-contents.pgp');
    return new Promise( (resolve, reject) => {
      execa('cat', [
        'debian-binary',
        'control.tar.gz',
        'data.tar.xz'
      ]).stdout.pipe(tmp)
      .on('error', reject)
      .on('close', () => resolve());
    });
  })
  .then(() => execa('ls', ['-alh']))
  .then((res) => debug('generated pgp file', res.stdout))
  // Create a GPG signature of the concatenated file, calling it _gpgorigin:
  // # gpg -abs -o _gpgorigin dist/combined-contents
  .then(() => psign('combined-contents.pgp'))
  .then(() => {
    // // Finally, bundle the .deb up again, including the signature file:
    // run(`ar rc ${target.asset('deb')} _gpgorigin debian-binary control.tar.gz data.tar.xz`);
    return execa('ar', ['rc', src, '_gpgorigin', 'debian-binary', 'control.tar.gz', 'data.tar.xz']);
  })
  .then(() => execa('ls', ['-alh']))
  ;
};
