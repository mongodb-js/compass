// Allowed values for the `ssl` field
module.exports = [
  /**
   * Do not use SSH tunneling.
   */
  'NONE',
  /**
   * The tunnel is created with username and password only.
   */
  'USER_PASSWORD',
  /**
   * The tunnel is created using an identity file.
   */
  'IDENTITY_FILE'
];
