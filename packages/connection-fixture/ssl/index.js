var path = require('path');

module.exports = {
  authTestsKey: path.join(__dirname, 'authTestsKey'),
  ca: path.join(__dirname, 'ca.pem'),
  client: path.join(__dirname, 'client.pem'),
  client_revoked: path.join(__dirname, 'client_revoked.pem'),
  'cluster-cert': path.join(__dirname, 'cluster-cert.pem'),
  crl: path.join(__dirname, 'crl.pem'),
  crl_client_revoked: path.join(__dirname, 'crl_client_revoked.pem'),
  crl_expired: path.join(__dirname, 'crl_expired.pem'),
  localhostnameCN: path.join(__dirname, 'localhostnameCN.pem'),
  localhostnameSAN: path.join(__dirname, 'localhostnameSAN.pem'),
  mycert: path.join(__dirname, 'mycert.pem'),
  password_protected: path.join(__dirname, 'password_protected.pem'),
  server: path.join(__dirname, 'server.pem'),
  smoke: path.join(__dirname, 'smoke.pem')
};
