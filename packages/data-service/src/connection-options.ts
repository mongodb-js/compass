export interface ConnectionOptions {
  /**
   * The connection string to connect to the MongoDB instance including all options set by the user.
   */
  connectionString: string;

  /**
   * If present the connection should be established via an SSH tunnel according to the provided SSH options.
   */
  sshTunnel?: ConnectionSshOptions;

  /**
   * If true, the connection uses the system CA store instead of tlsCAFile or the default Node.js store.
   */
  useSystemCA?: boolean;
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
