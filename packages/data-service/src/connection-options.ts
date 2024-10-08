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

  // Set either devtools-connect's applyProxyToOIDC flag or create a custom Agent
  // based on application-level HTTP settings. Defaults to 'false', i.e. app-level proxying.
  shareProxyWithConnection?: boolean;

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
   * Alternative to Socks5 proxying / SSH tunnel: If set, inherit Compass's application-level
   * proxy settings.
   */
  useApplicationLevelProxy?: boolean;

  /**
   * If present the connection should use OIDC authentication.
   */
  oidc?: OIDCOptions;

  /**
   * Options related to client-side field-level encryption.
   */
  fleOptions?: ConnectionFleOptions;

  /**
   * Optional, a real net / tls connection callback function option that is only
   * used in Compass as a way to pass extra metadata about an Atlas cluster when
   * connecting in the browser environment through the websocket
   */
  lookup?: () => {
    wsURL: string;
    projectId?: string;
    clusterName?: string;
    srvAddress?: string;
  };
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
