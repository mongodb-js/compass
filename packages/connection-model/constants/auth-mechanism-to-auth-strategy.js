// Maps `authMechanism` to `authStrategy`
module.exports = {
  DEFAULT: 'MONGODB',
  'SCRAM-SHA-1': 'MONGODB',
  'SCRAM-SHA-256': 'SCRAM-SHA-256',
  'MONGODB-CR': 'MONGODB',
  'MONGODB-X509': 'X509',
  GSSAPI: 'KERBEROS',
  SSPI: 'KERBEROS',
  PLAIN: 'LDAP',
  LDAP: 'LDAP'
};
