// Maps `authentication` to driver `authMechanism`
module.exports = {
  NONE: undefined,
  MONGODB: 'DEFAULT',
  KERBEROS: 'GSSAPI',
  X509: 'MONGODB-X509',
  LDAP: 'PLAIN',
  'SCRAM-SHA-256': 'SCRAM-SHA-256'
};
