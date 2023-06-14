import type { AutoEncryptionOptions } from 'mongodb';
import type { DevtoolsConnectOptions } from '@mongodb-js/devtools-connect';

type ExtractArrayEntryType<T> = T extends (infer U)[] ? U : never;
export type OIDCOptions = Omit<
  NonNullable<DevtoolsConnectOptions['oidc']>,
  'notifyDeviceFlow' | 'signal' | 'allowedFlows'
> & {
  // Set the driver's `authMechanismProperties` (non-url) `ALLOWED_HOSTS` value
  // to match the connection string hosts, including possible SRV "sibling" domains.
  enableUntrustedEndpoints?: boolean;

  allowedFlows?: ExtractArrayEntryType<
    NonNullable<DevtoolsConnectOptions['oidc']>['allowedFlows']
  >[];
};

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

  /**
   * If present the connection should use OIDC authentication.
   */
  oidc?: OIDCOptions;

  /**
   * Options related to client-side field-level encryption.
   */
  fleOptions?: ConnectionFleOptions;
}

export interface ConnectionFleOptions {
  /**
   * Whether to store KMS credentials to disk or not.
   */
  storeCredentials: boolean;

  /**
   * Encryption options passed to the driver verbatim.
   */
  autoEncryption?: AutoEncryptionOptions;
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
