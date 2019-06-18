// Allowed values for the `authentication` field
module.exports = [
  /**
   * Use no authentication.
   */
  'NONE',
  /**
   * Allow the driver to autodetect and select SCRAM-SHA-1
   * or MONGODB-CR depending on server capabilities.
   */
  'MONGODB',
  /**
   * @enterprise
   * @see http://bit.ly/mongodb-node-driver-x509
   */
  'X509',
  /**
   * @enterprise
   * @see http://bit.ly/mongodb-node-driver-kerberos
   */
  'KERBEROS',
  /**
   * @enterprise
   * @see http://bit.ly/mongodb-node-driver-ldap
   */
  'LDAP',
  'SCRAM-SHA-256'
];
