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
import fs from 'fs';
import crypto from 'crypto';
import pbkdf2 from 'pbkdf2';
import _ from 'lodash';
import request from 'superagent';
import createDebug from 'debug';
import type { Blob } from 'buffer';
const debug = createDebug('mongodb-notary-service-client');

const pkg = {
  name: '@mongodb-js/mongodb-notary-service-client',
  version: '2.0.4',
  homepage: 'https://github.com/mongodb-js/compass',
};

/**
 * @param {String} secret
 * @return {String}
 * @api private
 */
export function getSalt(secret: any) {
  const salt = _.chain(secret).split('').reverse().join('').value();
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

  let comment = '';
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
export function generateAuthToken(
  secret:
    | string
    | Buffer
    | (
        | Int8Array
        | Uint8Array
        | Uint8ClampedArray
        | Int16Array
        | Uint16Array
        | Int32Array
        | Uint32Array
        | Float32Array
        | Float64Array
      )
    | DataView,
  dateStr?: crypto.BinaryLike | undefined
) {
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
function getSigningParams(
  endpoint: any,
  key: any,
  token: any,
  comment?: string
) {
  return {
    url: `${endpoint}/api/sign`,
    key: key,
    authToken: generateAuthToken(token),
    comment: comment || generateComment(),
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
function sign(
  src: string | number | boolean | Buffer | Blob | fs.ReadStream,
  params: { url: string; key: string; authToken: string; comment: string }
): Promise<{ permalink: string }> {
  debug('attempting to sign %s via notary-service', src, params);
  return new Promise(function (resolve, reject) {
    return request
      .post(params.url)
      .field('key', params.key)
      .field('comment', params.comment)
      .field('auth_token', params.authToken)
      .attach('file', src)
      .end(function (err, res) {
        if (err) {
          debug('request error:', err);
          return reject(err);
        }
        if (!res.body.permalink) {
          debug('signing service did not return a permalink');
          return reject(
            new Error('Signing service did not return a permalink')
          );
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
function download(url: string, dest: string) {
  debug('downloading %s to %s...', url, dest);
  return new Promise(function (resolve, reject) {
    request
      .get(url)
      .pipe(fs.createWriteStream(dest))
      .on('error', function (err) {
        debug('download error:', err);
        reject(err);
      })
      .on('close', function () {
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
function configure() {
  const opts = {
    endpoint: process.env.NOTARY_URL,
    key: process.env.NOTARY_SIGNING_KEY,
    token: process.env.NOTARY_AUTH_TOKEN,
    message: '',
  };

  const configured = ['endpoint', 'key', 'token'].every((k) => {
    if (!(opts as any)[k]) {
      debug(`Missing ${k}. Skipping.`);
      opts.message = `No value for ${k}`;
      return false;
    }
    return true;
  });

  const config = { ...opts, configured };
  debug('config', config);
  return config;
}

/**
 * Sign and download `src` in-place.
 *
 * @param {String} src
 * @return {Promise}
 * @api public
 */
export default function (src: any) {
  const opts = configure();
  if (!opts.configured) {
    return Promise.resolve(false);
  }

  const params = getSigningParams(opts.endpoint, opts.key, opts.token);
  return sign(src, params).then((res) => {
    return download(`${opts.endpoint}/${res.permalink}`, src);
  });
}

/**
 * Fetch most recent logs for debugging.
 *
 * @return {Promise}
 * @api public
 */
export const logs = function () {
  const opts = configure();
  if (!opts.configured) {
    return Promise.resolve(false);
  }
  return new Promise(function (resolve, reject) {
    const url = `${opts.endpoint}/api/log`;
    debug('Fetching logs from', url);

    request
      .get(url)
      .type('json')
      .end(function (err, res) {
        if (err) return reject(err);
        debug('response', res.body);
        resolve(res.body.entries);
      });
  });
};
