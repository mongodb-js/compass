import SSHTunnel, { SshTunnelConfig } from '@mongodb-js/ssh-tunnel';
import { MongoClient, MongoClientOptions, ReadPreferenceLike } from 'mongodb';
import { promisify } from 'util';
import { ConnectionOptions } from './connection-options';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ConnectionModel = require('mongodb-connection-model');

export interface LegacyConnectionModelProperties {
  _id: string;
  hostname: string;
  port: number;
  ns?: string;

  authStrategy:
    | 'NONE'
    | 'MONGODB'
    | 'X509'
    | 'KERBEROS'
    | 'LDAP'
    | 'SCRAM-SHA-256';

  hosts?: string[];
  isSrvRecord?: boolean;

  replicaSet?: string;
  connectTimeoutMS?: number;
  socketTimeoutMS?: number;
  compression?: any;
  maxPoolSize?: number;
  minPoolSize?: number;
  maxIdleTimeMS?: number;
  waitQueueMultiple?: number;
  waitQueueTimeoutMS?: number;
  w?: any;
  wTimeoutMS?: number;
  journal?: boolean;
  readConcernLevel?: string;
  readPreference: ReadPreferenceLike;
  maxStalenessSeconds?: number;
  readPreferenceTags?: string[];
  authSource?: string;
  authMechanism?: string;
  authMechanismProperties?: any;
  gssapiServiceName?: string;
  gssapiServiceRealm?: string;
  gssapiCanonicalizeHostName?: string;
  localThresholdMS?: number;
  serverSelectionTimeoutMS?: number;
  serverSelectionTryOnce?: boolean;
  hearbeatFrequencyMS?: number;
  appname?: string;
  retryWrites?: boolean;
  uuidRepresentation?:
    | 'standard'
    | 'csharpLegacy'
    | 'javaLegacy'
    | 'pythonLegacy';
  directConnection?: boolean;
  loadBalanced?: boolean;

  mongodbUsername?: string;
  mongodbPassword?: string;
  mongodbDatabaseName?: string;
  promoteValues?: boolean;

  kerberosServiceName?: string;
  kerberosPrincipal?: string;
  kerberosServiceRealm?: string;
  kerberosCanonicalizeHostname?: string;

  ldapUsername?: string;
  ldapPassword?: string;

  x509Username?: string;

  ssl?: any;
  sslMethod:
    | 'NONE'
    | 'SYSTEMCA'
    | 'IFAVAILABLE'
    | 'UNVALIDATED'
    | 'SERVER'
    | 'ALL';
  sslCA?: any;
  sslCert?: any;
  sslKey?: any;
  sslPass?: string;

  sshTunnel?: 'NONE' | 'USER_PASSWORD' | 'IDENTITY_FILE';
  sshTunnelHostname?: string;
  sshTunnelPort: number;
  sshTunnelBindToLocalPort?: number;
  sshTunnelUsername?: string;
  sshTunnelPassword?: string;
  sshTunnelIdentityFile?: string;
  sshTunnelPassphrase?: string;

  lastUsed?: Date;
  isFavorite: boolean;
  name: string;
  color?: string;
}

export interface AmpersandMethodOptions<T> {
  success: (model: T) => void;
  error: (model: T, error: Error) => void;
}

export interface LegacyConnectionModel extends LegacyConnectionModelProperties {
  // The readonly properties are "computed" properties
  readonly driverUrl: string;
  readonly driverUrlWithSsh: string;
  readonly driverOptions: MongoClientOptions;
  readonly sshTunnelOptions?: SshTunnelConfig;

  connect(
    model: LegacyConnectionModel,
    setupListeners: (client: MongoClient) => void,
    callback: (
      err: Error,
      client: MongoClient,
      tunnel: SSHTunnel,
      options: MongoClientOptions
    ) => void
  ): void;

  toJSON(): LegacyConnectionModelProperties;
  save: (
    attributes?: Partial<LegacyConnectionModel>,
    options?: AmpersandMethodOptions<LegacyConnectionModel>
  ) => void;
  destroy: (options?: AmpersandMethodOptions<LegacyConnectionModel>) => void;
  once: (event: string, handler: () => void) => void;
}

export function convertConnectionModelToOptions(
  model: LegacyConnectionModel
): ConnectionOptions {
  const options: ConnectionOptions = {
    id: model._id,
    connectionString: model.driverUrl,
  };

  if (
    model.sshTunnel !== 'NONE' &&
    model.sshTunnelHostname &&
    model.sshTunnelUsername
  ) {
    options.sshTunnel = {
      host: model.sshTunnelHostname,
      port: model.sshTunnelPort,
      username: model.sshTunnelUsername,
    };
    if (model.sshTunnelPassword !== undefined) {
      options.sshTunnel.password = model.sshTunnelPassword;
    }
    if (model.sshTunnelIdentityFile !== undefined) {
      options.sshTunnel.privateKeyFile = model.sshTunnelIdentityFile;
    }
    if (model.sshTunnelPassphrase !== undefined) {
      options.sshTunnel.privateKeyPassphrase = model.sshTunnelPassphrase;
    }
  }

  if (model.isFavorite) {
    options.favorite = {
      name: model.name,
      color: model.color,
    };
  }

  return options;
}

export async function convertConnectionOptionsToModel(
  options: ConnectionOptions
): Promise<LegacyConnectionModel> {
  const connection: LegacyConnectionModel = await promisify(
    ConnectionModel.from
  )(options.connectionString);

  const additionalOptions: Partial<LegacyConnectionModelProperties> = {
    _id: options.id,
  };

  if (options.sshTunnel) {
    additionalOptions.sshTunnel = !options.sshTunnel.privateKeyFile
      ? 'USER_PASSWORD'
      : 'IDENTITY_FILE';
    additionalOptions.sshTunnelHostname = options.sshTunnel.host;
    additionalOptions.sshTunnelUsername = options.sshTunnel.username;
    additionalOptions.sshTunnelPassword = options.sshTunnel.password;
    additionalOptions.sshTunnelIdentityFile = options.sshTunnel.privateKeyFile;
    additionalOptions.sshTunnelPassphrase =
      options.sshTunnel.privateKeyPassphrase;
  }

  if (options.favorite) {
    additionalOptions.isFavorite = true;
    additionalOptions.name = options.favorite.name;
    additionalOptions.color = options.favorite.color;
  }

  return new ConnectionModel({
    ...connection.toJSON(),
    ...additionalOptions,
  });
}
