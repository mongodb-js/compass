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
const pkg = require('../package.json');
const dotenv = require('dotenv');

const debug = require('debug')('mongodb-notary-service-client');

/**
 * @param {String} secret
 * @return {String}
 * @api private
 */
function getSalt(secret) {
  const salt = _.chain(secret)
    .split('')
    .reverse()
    .join('')
    .value();
  return salt;
}

/**
 * @return {String}
 * @api private
 */
function generateComment() {
  const project = process.env.EVERGREEN_PROJECT;
  const variant = process.env.EVERGREEN_BUILD_VARIANT;
  const revision = process.env.EVERGREEN_REVISION;
  const branch = process.env.EVERGREEN_BRANCH_NAME;

  var comment = '';
  if (process.env.EVERGREEN) {
    comment += `Evergreen project ${project} ${revision} - ${variant} - ${branch} | `;
  }
  comment += `via ${pkg.name}@${pkg.version}:${pkg.homepage}`;
  return comment;
}


/**
 * @param {String} secret
 * @param {String} [dateStr]
 * @return {Promise}
 * @api private
 */
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

/**
 * Generate API params for `sign`.
 *
 * @param {String} endpoint
 * @param {String} key
 * @param {String} token
 * @param {String} [comment]
 * @return {Object}
 * @api private
 */
function getSigningParams(endpoint, key, token, comment) {
  return {
    url: `${endpoint}/api/sign`,
    key: key,
    authToken: generateAuthToken(token),
    comment: comment || generateComment()
  };
}

/**
 * Sign `src` using the notary-service.
 *
 * @param {String} src
 * @param {Object} params
 * @return {Promise}
 * @api private
 */
function sign(src, params) {
  debug('attempting to sign %s via notary-service', src, params);
  return new Promise(function(resolve, reject) {
    return request.post(params.url)
      .field('key', params.key)
      .field('comment', params.comment)
      .field('auth_token', params.authToken)
      .attach('file', src)
      .end(function(err, res) {
        if (err) {
          debug('request error:', err);
          return reject(err);
        }
        if (!res.body.permalink) {
          debug('signing service did not return a permalink');
          return reject(new Error('Signing service did not return a permalink'));
        }

        debug('Success!', res.body);
        resolve(res.body);
      });
  });
}

/**
 * Download a file from `url` to `dest`.
 *
 * @param {String} url
 * @param {String} dest
 * @return {Promise}
 * @api private
 */
function download(url, dest) {
  debug('downloading %s to %s...', url, dest);
  return new Promise(function(resolve, reject) {
    request.get(url).pipe(fs.createWriteStream(dest))
      .on('error', function(err) {
        debug('download error:', err);
        reject(err);
      })
      .on('close', function() {
        debug('download completed successfully!');
        resolve(dest);
      });
  });
}

/**
 * @param {Object} [opts]
 * @return {Object}
 * @api private
 */
function configure(opts) {
  opts = opts || {};
  dotenv.load();

  _.defaults(opts, {
    endpoint: process.env.NOTARY_URL,
    key: process.env.NOTARY_SIGNING_KEY,
    token: process.env.NOTARY_AUTH_TOKEN
  });

  opts.configured = ['endpoint', 'key', 'token'].every((k) => {
    if (!opts[k]) {
      debug(`Missing ${k}. Skipping.`);
      opts.message = `No value for ${k}`;
      return false;
    }
    return true;
  });

  debug('config', opts);
  return opts;
}

/**
 * Sign and download `src` in-place.
 *
 * @param {String} src
 * @return {Promise}
 * @api public
 */
module.exports = function(src) {
  const opts = configure();
  if (!opts.configured) {
    return Promise.resolve(false);
  }

  const params = getSigningParams(opts.endpoint, opts.key, opts.token);
  return sign(src, params).then((res) => {
    return download(`${opts.endpoint}/${res.permalink}`, src);
  });
};

/**
 * Fetch most recent logs for debugging.
 *
 * @return {Promise}
 * @api public
 */
module.exports.logs = function() {
  const opts = configure();
  if (!opts.configured) {
    return Promise.resolve(false);
  }
  return new Promise(function(resolve, reject) {
    const url = `${opts.endpoint}/api/log`;
    debug('Fetching logs from', url);

    request.get(url)
      .type('json')
      .end(function(err, res) {
        if (err) return reject(err);
        debug('response', res.body);
        resolve(res.body.entries);
      });
  });
};

module.exports.getSalt = getSalt;
module.exports.generateAuthToken = generateAuthToken;
module.exports.download = download;
module.exports.sign = sign;
module.exports.configure = configure;
