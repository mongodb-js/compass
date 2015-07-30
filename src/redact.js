var _ = require('lodash');

var CERTIFICATE_REGEX = /-----BEGIN CERTIFICATE-----.*-----END CERTIFICATE-----/mg;
var PRIVATE_KEY_REGEX = /-----BEGIN RSA PRIVATE KEY-----.*-----END RSA PRIVATE KEY-----/mg;
var NIX_USERNAME_PATH = /\/Users\/[^\/]*\//mg;
var WINDOWS_USERNAME_PATH = /\\Users\\[^\/]*\\/mg;

function redact(message) {
  if (_.isPlainObject(message)) {
    return _.mapValues(message, redact);
  }
  if (!_.isString(message)) {
    return message;
  }
  return message
    .replace(CERTIFICATE_REGEX, '<redacted>')
    .replace(PRIVATE_KEY_REGEX, '<redacted>')
    .replace(NIX_USERNAME_PATH, '/Users/<redacted>/')
    .replace(WINDOWS_USERNAME_PATH, '\\Users\\<redacted>\\');
}
module.exports = redact;
