export interface ConnectionOptions {
  /**
   * The connection string to connect to the MongoDB instance including all options set by the user.
   */
  connectionString: string;

  /**
   * This setting only exists for compatibility with the `sslCert` property of the legacy connection model.
   * Compass allows users to specify both a certificate as well as a certificate key as individual files
   * which are then mapped to explicit `tlsCertificateFile` and `tlsCertificateKeyFile` driver options.
   * The connection string spec only supports a single `tlsCertificateKeyFile` parameter, however.
   *
   * See https://jira.mongodb.org/browse/COMPASS-5058 and https://jira.mongodb.org/browse/NODE-3591
   */
  tlsCertificateFile?: string;

  /**
   * If present the connection should be established via an SSH tunnel according to the provided SSH options.
   */
  sshTunnel?: ConnectionSshOptions;
}

export interface ConnectionSshOptions {
  /**
   * Host to establish SSH tunnel to.
   */
  host: string;

  /**
   * Port to establish SSH tunnel to.
   */
  port: number;

  /**
   * Username of the SSH user.
   */
  username: string;

  /**
   * Password for SSH authentication.
   */
  password?: string;

  /**
   * Private key file to use as SSH identity.
   */
  identityKeyFile?: string;

  /**
   * Password for protected `identitiyFile`.
   */
  identityKeyPassphrase?: string;
}
