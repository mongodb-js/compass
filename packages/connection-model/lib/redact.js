function redactConnectionString(uri) {
  const regexes = [
    // Username and password
    /(?<=\/\/)(.*)(?=\@)/g,
    // AWS IAM Session Token as part of query parameter
    /(?<=AWS_SESSION_TOKEN(:|%3A))([^,&]+)/
  ];
  regexes.forEach(r => {
    uri = uri.replace(r, '<credentials>');
  });
  return uri;
}

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
