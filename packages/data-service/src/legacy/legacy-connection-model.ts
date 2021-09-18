import SSHTunnel, { SshTunnelConfig } from '@mongodb-js/ssh-tunnel';
import { MongoClient, MongoClientOptions, ReadPreferenceLike } from 'mongodb';
import ConnectionString from 'mongodb-connection-string-url';
import { promisify } from 'util';
import { ConnectionOptions } from '../connection-options';

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

  hosts?: Array<{
    host: string;
    port: number;
  }>;
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
  sslCA?: string[];
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

  convertSslPropertiesToConnectionOptions(model, options);
  if (model.sslCert && model.sslCert !== model.sslKey) {
    options.tlsCertificateFile = model.sslCert;
  }

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
      options.sshTunnel.identityKeyFile = model.sshTunnelIdentityFile;
    }
    if (model.sshTunnelPassphrase !== undefined) {
      options.sshTunnel.identityKeyPassphrase = model.sshTunnelPassphrase;
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

function convertSslPropertiesToConnectionOptions(
  model: LegacyConnectionModel,
  options: ConnectionOptions
): void {
  const url = new ConnectionString(options.connectionString);

  switch (model.sslMethod) {
    case 'SERVER':
      url.searchParams.set('tlsAllowInvalidCertificates', 'false');
      convertSslCAToConnectionString(model.sslCA, url);
      break;
    case 'ALL':
      url.searchParams.set('tlsAllowInvalidCertificates', 'false');
      convertSslCAToConnectionString(model.sslCA, url);
      if (model.sslCert && model.sslCert !== model.sslKey) {
        options.tlsCertificateFile = model.sslCert;
      }
      if (model.sslKey) {
        url.searchParams.set('tlsCertificateKeyFile', model.sslKey);
      }
      if (model.sslPass) {
        url.searchParams.set('tlsCertificateKeyFilePassword', model.sslPass);
      }
      break;
    case 'UNVALIDATED':
      url.searchParams.set('tlsAllowInvalidCertificates', 'true');
      url.searchParams.set('tlsAllowInvalidHostnames', 'true');
      break;
    case 'SYSTEMCA':
      url.searchParams.set('tlsAllowInvalidCertificates', 'false');
      url.searchParams.set('tlsAllowInvalidHostnames', 'false');
      break;
    case 'IFAVAILABLE':
      url.searchParams.set('tlsAllowInvalidCertificates', 'false');
      url.searchParams.set('tlsAllowInvalidHostnames', 'true');
      break;
  }

  options.connectionString = url.toString();
}

function convertSslCAToConnectionString(
  sslCA: string | string[] | undefined,
  url: ConnectionString
): void {
  if (!sslCA) {
    return;
  }
  if (typeof sslCA === 'string') {
    url.searchParams.set('tlsCAFile', sslCA);
  } else if (Array.isArray(sslCA) && sslCA.length > 0) {
    url.searchParams.set('tlsCAFile', sslCA[0]);
  }
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

  convertSslOptionsToLegacyProperties(options, additionalOptions);

  if (options.sshTunnel) {
    additionalOptions.sshTunnel = !options.sshTunnel.identityKeyFile
      ? 'USER_PASSWORD'
      : 'IDENTITY_FILE';
    additionalOptions.sshTunnelHostname = options.sshTunnel.host;
    additionalOptions.sshTunnelPort = options.sshTunnel.port;
    additionalOptions.sshTunnelUsername = options.sshTunnel.username;
    additionalOptions.sshTunnelPassword = options.sshTunnel.password;
    additionalOptions.sshTunnelIdentityFile = options.sshTunnel.identityKeyFile;
    additionalOptions.sshTunnelPassphrase =
      options.sshTunnel.identityKeyPassphrase;
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

function guessSslMethod(
  url: ConnectionString
):
  | 'NONE'
  | 'SYSTEMCA'
  | 'IFAVAILABLE'
  | 'UNVALIDATED'
  | 'SERVER'
  | 'ALL'
  | undefined {
  const tls =
    url.searchParams.get('tls') === 'true' ||
    url.searchParams.get('ssl') === 'true';
  const tlsAllowInvalidCertificates =
    url.searchParams.get('tlsAllowInvalidCertificates') === 'true';
  const tlsAllowInvalidHostnames =
    url.searchParams.get('tlsAllowInvalidHostnames') === 'true';
  const tlsInsecure = url.searchParams.get('tlsInsecure') === 'true';
  const tlsCAFile = url.searchParams.get('tlsCAFile');

  if (!tls) {
    return 'NONE';
  }

  if (tlsInsecure || tlsAllowInvalidCertificates) {
    return 'UNVALIDATED';
  }

  if (tlsAllowInvalidHostnames) {
    return 'IFAVAILABLE';
  }

  return 'SYSTEMCA';
}

function convertSslOptionsToLegacyProperties(
  options: ConnectionOptions
): Partial<LegacyConnectionModelProperties> {
  const url = new ConnectionString(options.connectionString);
  const tls =
    url.searchParams.get('tls') === 'true' ||
    url.searchParams.get('ssl') === 'true';
  const tlsAllowInvalidCertificates =
    url.searchParams.get('tlsAllowInvalidCertificates') === 'true';
  const tlsAllowInvalidHostnames =
    url.searchParams.get('tlsAllowInvalidHostnames') === 'true';

  const tlsInsecure = url.searchParams.get('tlsInsecure') === 'true';
  const tlsCAFile = url.searchParams.get('tlsCAFile');
  const tlsCertificateKeyFile =
    options.tlsCertificateFile || url.searchParams.get('tlsCertificateKeyFile');
  const tlsCertificateKeyFilePassword = url.searchParams.get(
    'tlsCertificateKeyFilePassword'
  );

  if (!tls) {
    return { sslMethod: 'NONE' };
  }

  if (tlsInsecure || tlsAllowInvalidCertificates) {
    return { sslMethod: 'UNVALIDATED' };
  }

  // if (tlsCAFile) {
  //   return {
  //     sslMethod: 'SERVER',
  //     sslCA: tlsCAFile,
  //     // properties.sslKey = undefined;
  //   };
  // }

  if (tlsAllowInvalidHostnames) {
    return 'IFAVAILABLE';
  }

  return {
    sslMethod: 'SYSTEMCA',
  };

  // if (!tls) {
  //   properties.sslMethod = 'NONE';
  // } else if (tlsCAFile && !tlsAllowInvalidCertificates) {
  //   properties.sslMethod = 'SERVER';
  //   properties.sslCert = undefined;

  //   properties.sslKey = undefined;
  //   if (options.tlsCertificateFile || tlsCertificateKeyFile) {
  //     properties.sslMethod = 'ALL';
  //     properties.sslCert = options.tlsCertificateFile ?? tlsCertificateKeyFile;
  //     properties.sslKey = tlsCertificateKeyFile ?? undefined;
  //     properties.sslPass = tlsCertificateKeyFilePassword ?? undefined;
  //   }
  // } else {
  //   properties.sslCA = undefined;
  //   properties.sslCert = undefined;
  //   properties.sslKey = undefined;
  //   properties.sslPass = undefined;
  //   if (tlsInsecure) {
  //     properties.sslMethod = 'UNVALIDATED';
  //   } else if (
  //     tlsInsecure ||
  //     (tlsAllowInvalidCertificates && tlsAllowInvalidHostnames)
  //   ) {
  //     properties.sslMethod = 'UNVALIDATED';
  //   } else if (!tlsAllowInvalidCertificates && !tlsAllowInvalidHostnames) {
  //     properties.sslMethod = 'SYSTEMCA';
  //   } else if (!tlsAllowInvalidCertificates && tlsAllowInvalidHostnames) {
  //     properties.sslMethod = 'IFAVAILABLE';
  //   }
  // }
}
