// Allowed values for the `sslMethod` field
module.exports = [
  /**
   * Don't pass anything and let the driver decide
   */
  'DEFAULT',
  /**
   * Do not use SSL for anything.
   */
  'NONE',
  /**
   * Use system CA.
   */
  'SYSTEMCA',
  /**
   * Use SSL if available.
   */
  'IFAVAILABLE',
  /**
   * Use SSL but do not perform any validation of the certificate chain.
   */
  'UNVALIDATED',
  /**
   * The driver should validate the server certificate and fail to connect if validation fails.
   */
  'SERVER',
  /**
   * The driver must present a valid certificate and validate the server certificate.
   */
  'ALL'
];
