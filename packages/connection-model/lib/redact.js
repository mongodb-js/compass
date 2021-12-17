const { redactConnectionString } = require('mongodb-connection-string-url');

function redactSshTunnelOptions(options) {
  const redacted = { ...options };

  if (redacted.password) {
    redacted.password = '<redacted>';
  }

  if (redacted.privateKey) {
    redacted.privateKey = '<redacted>';
  }

  if (redacted.passphrase) {
    redacted.passphrase = '<redacted>';
  }

  return redacted;
}

module.exports = {
  redactConnectionString,
  redactSshTunnelOptions
};
