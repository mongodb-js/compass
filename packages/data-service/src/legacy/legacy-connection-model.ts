import type { SshTunnelConfig } from '@mongodb-js/ssh-tunnel';
import type SSHTunnel from '@mongodb-js/ssh-tunnel';
import type { AmpersandMethodOptions } from '@mongodb-js/compass-utils';
import type {
  MongoClient,
  MongoClientOptions,
  ReadPreferenceLike,
} from 'mongodb';
import ConnectionString from 'mongodb-connection-string-url';
import util from 'util';
import type { ConnectionInfo } from '../connection-info';
import type {
  ConnectionOptions,
  ConnectionSshOptions,
} from '../connection-options';
import type { ConnectionSecrets } from '../connection-secrets';
import { extractSecrets, mergeSecrets } from '../connection-secrets';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ConnectionModel = require('mongodb-connection-model');

type SslMethod =
  | 'NONE'
  | 'SYSTEMCA'
  | 'IFAVAILABLE'
  | 'UNVALIDATED'
  | 'SERVER'
  | 'ALL';

function deleteCompassAppNameParam(
  connectionInfo: ConnectionInfo
): ConnectionInfo {
  let connectionStringUrl;

  try {
    connectionStringUrl = new ConnectionString(
      connectionInfo.connectionOptions.connectionString
    );
  } catch {
    return connectionInfo;
  }

  if (
    /^mongodb compass/i.exec(
      connectionStringUrl.searchParams.get('appName') || ''
    )
  ) {
    connectionStringUrl.searchParams.delete('appName');
  }

  return {
    ...connectionInfo,
    connectionOptions: {
      ...connectionInfo.connectionOptions,
      connectionString: connectionStringUrl.href,
    },
  };
}

export interface LegacyConnectionModelProperties {
  _id: string;
  hostname: string;
  port: number;
  ns?: string;
  connectionInfo?: ConnectionInfo;
  secrets?: ConnectionSecrets;

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
  kerberosCanonicalizeHostname: boolean;

  ldapUsername?: string;
  ldapPassword?: string;

  x509Username?: string;

  ssl?: any;
  sslMethod: SslMethod;

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
  sshTunnelIdentityFile?: string | string[];
  sshTunnelPassphrase?: string;

  lastUsed?: Date;
  isFavorite: boolean;
  name: string;
  title?: string;
  color?: string;
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

export function convertConnectionModelToInfo(
  model: LegacyConnectionModelProperties
): ConnectionInfo {
  const legacyModel: LegacyConnectionModel =
    model instanceof ConnectionModel ? model : new ConnectionModel(model);

  // Already migrated
  if (legacyModel.connectionInfo) {
    const connectionInfo = mergeSecrets(
      legacyModel.connectionInfo,
      legacyModel.secrets ?? {}
    );

    if (connectionInfo.lastUsed) {
      // could be parsed from json and be a string
      connectionInfo.lastUsed = new Date(connectionInfo.lastUsed);
    }

    return deleteCompassAppNameParam(connectionInfo);
  }

  // Not migrated yet, has to be converted
  const info: ConnectionInfo = {
    id: legacyModel._id,
    connectionOptions: {
      connectionString: legacyModel.driverUrl,
    },
  };

  modelSslPropertiesToConnectionOptions(
    legacyModel.driverOptions,
    info.connectionOptions
  );

  const sshTunnel = modelTunnelToConnectionOptions(legacyModel);
  if (sshTunnel) {
    info.connectionOptions.sshTunnel = sshTunnel;
  }

  if (legacyModel.driverOptions.directConnection !== undefined) {
    setConnectionStringParam(
      info.connectionOptions,
      'directConnection',
      legacyModel.driverOptions.directConnection ? 'true' : 'false'
    );
  }

  if (legacyModel.driverOptions.readPreference !== undefined) {
    setConnectionStringParam(
      info.connectionOptions,
      'readPreference',
      typeof legacyModel.driverOptions.readPreference === 'string'
        ? legacyModel.driverOptions.readPreference
        : legacyModel.driverOptions.readPreference.preference
    );
  }

  if (legacyModel.isFavorite) {
    info.favorite = {
      name: legacyModel.name,
      color: legacyModel.color,
    };
  }

  if (legacyModel.lastUsed) {
    info.lastUsed = legacyModel.lastUsed;
  }

  return deleteCompassAppNameParam(setDirectConnectionForSingleHosts(info));
}

function setDirectConnectionForSingleHosts(connectionInfo: ConnectionInfo) {
  let connectionStringUrl;

  try {
    connectionStringUrl = new ConnectionString(
      connectionInfo.connectionOptions.connectionString
    );
  } catch {
    return connectionInfo;
  }

  const isLoadBalanced =
    connectionStringUrl.searchParams.get('loadBalanced') === 'true';
  const isReplicaSet =
    connectionStringUrl.isSRV ||
    connectionStringUrl.hosts.length > 1 ||
    connectionStringUrl.searchParams.has('replicaSet');
  const hasDirectConnection =
    connectionStringUrl.searchParams.has('directConnection');

  if (!isReplicaSet && !isLoadBalanced && !hasDirectConnection) {
    connectionStringUrl.searchParams.set('directConnection', 'true');
  }

  return {
    ...connectionInfo,
    connectionOptions: {
      ...connectionInfo.connectionOptions,
      connectionString: connectionStringUrl.href,
    },
  };
}

function setConnectionStringParam<K extends keyof MongoClientOptions>(
  connectionOptions: ConnectionOptions,
  param: K,
  value: string
) {
  const url = new ConnectionString(connectionOptions.connectionString);
  url.typedSearchParams<MongoClientOptions>().set(param, value);
  connectionOptions.connectionString = url.toString();
}

function modelSslPropertiesToConnectionOptions(
  driverOptions: MongoClientOptions,
  connectionOptions: ConnectionOptions
): void {
  const url = new ConnectionString(connectionOptions.connectionString);
  const searchParams = url.typedSearchParams<MongoClientOptions>();

  if (driverOptions.sslValidate === false) {
    searchParams.set('tlsAllowInvalidCertificates', 'true');
  }

  if (driverOptions.tlsAllowInvalidHostnames) {
    searchParams.set('tlsAllowInvalidHostnames', 'true');
  }

  const sslCA = getSslDriverOptionsFile(driverOptions.sslCA);
  const sslCert = getSslDriverOptionsFile(driverOptions.sslCert);
  const sslKey = getSslDriverOptionsFile(driverOptions.sslKey);

  if (sslCA) {
    searchParams.set('tlsCAFile', sslCA);
  }

  // See https://jira.mongodb.org/browse/NODE-3591 and
  // https://jira.mongodb.org/browse/COMPASS-5058
  if (sslCert && sslCert !== sslKey) {
    searchParams.set('tlsCertificateFile', sslCert);
  }

  if (sslKey) {
    searchParams.set('tlsCertificateKeyFile', sslKey);
  }

  if (driverOptions.sslPass) {
    searchParams.set('tlsCertificateKeyFilePassword', driverOptions.sslPass);
  }

  if (
    searchParams.get('ssl') === 'true' &&
    searchParams.get('tls') === 'true'
  ) {
    searchParams.delete('ssl');
  }

  connectionOptions.connectionString = url.toString();
}

function getSslDriverOptionsFile(
  value: string | string[] | undefined
): string | undefined {
  if (!Array.isArray(value)) {
    return value;
  }

  return value[0];
}

function modelTunnelToConnectionOptions(
  model: LegacyConnectionModel
): ConnectionSshOptions | undefined {
  if (
    model.sshTunnel === 'NONE' ||
    !model.sshTunnelHostname ||
    !model.sshTunnelUsername
  ) {
    return;
  }

  const sshTunnel: ConnectionSshOptions = {
    host: model.sshTunnelHostname,
    port: model.sshTunnelPort,
    username: model.sshTunnelUsername,
  };

  if (model.sshTunnelPassword !== undefined) {
    sshTunnel.password = model.sshTunnelPassword;
  }

  if (model.sshTunnelIdentityFile !== undefined) {
    sshTunnel.identityKeyFile = Array.isArray(model.sshTunnelIdentityFile)
      ? model.sshTunnelIdentityFile[0]
      : model.sshTunnelIdentityFile;
  }

  if (model.sshTunnelPassphrase !== undefined) {
    sshTunnel.identityKeyPassphrase = model.sshTunnelPassphrase;
  }

  return sshTunnel;
}

async function tryConvertBackwardCompatibleOptions(
  connectionInfo: ConnectionInfo
): Promise<Partial<LegacyConnectionModelProperties>> {
  try {
    const legacyConnectionModelProperties: Partial<LegacyConnectionModelProperties> =
      {};

    const connection: LegacyConnectionModel = await util.promisify(
      ConnectionModel.from
    )(removeAWSParams(connectionInfo.connectionOptions.connectionString));

    convertSslOptionsToLegacyProperties(
      connectionInfo.connectionOptions,
      legacyConnectionModelProperties
    );

    const connectionOptions = connectionInfo.connectionOptions;

    if (connectionOptions.sshTunnel) {
      legacyConnectionModelProperties.sshTunnel = !connectionOptions.sshTunnel
        .identityKeyFile
        ? 'USER_PASSWORD'
        : 'IDENTITY_FILE';
      legacyConnectionModelProperties.sshTunnelPort =
        connectionOptions.sshTunnel.port;
      legacyConnectionModelProperties.sshTunnelHostname =
        connectionOptions.sshTunnel.host;
      legacyConnectionModelProperties.sshTunnelUsername =
        connectionOptions.sshTunnel.username;
      legacyConnectionModelProperties.sshTunnelPassword =
        connectionOptions.sshTunnel.password;
      legacyConnectionModelProperties.sshTunnelIdentityFile =
        connectionOptions.sshTunnel.identityKeyFile;
      legacyConnectionModelProperties.sshTunnelPassphrase =
        connectionOptions.sshTunnel.identityKeyPassphrase;
    }

    if (connectionInfo.favorite) {
      legacyConnectionModelProperties.isFavorite = true;
      legacyConnectionModelProperties.name = connectionInfo.favorite.name;
      legacyConnectionModelProperties.color = connectionInfo.favorite.color;
    }

    if (connectionInfo.lastUsed) {
      legacyConnectionModelProperties.lastUsed = connectionInfo.lastUsed;
    }

    return {
      ...connection.toJSON(),
      ...legacyConnectionModelProperties,
    };
  } catch (e) {
    return {};
  }
}

export async function convertConnectionInfoToModel(
  connectionInfo: ConnectionInfo
): Promise<LegacyConnectionModel> {
  return new ConnectionModel({
    // Attempt to add options for the old ampersand
    // connection model. This would allow older version
    // of Compass to work with new connections,
    // making possible to downgrade
    ...(await tryConvertBackwardCompatibleOptions(connectionInfo)),
    _id: connectionInfo.id,
    ...extractSecrets(connectionInfo),
  });
}

function convertSslOptionsToLegacyProperties(
  options: ConnectionOptions,
  properties: Partial<LegacyConnectionModelProperties>
): void {
  const url = new ConnectionString(options.connectionString);
  const searchParams = url.typedSearchParams<MongoClientOptions>();
  const tlsCAFile = searchParams.get('tlsCAFile');
  const tlsCertificateKeyFile = searchParams.get('tlsCertificateKeyFile');
  const tlsCertificateKeyFilePassword = searchParams.get(
    'tlsCertificateKeyFilePassword'
  );

  const tlsCertificateFile = searchParams.get('tlsCertificateFile');

  if (tlsCAFile) {
    properties.sslCA = [tlsCAFile];
  }

  if (tlsCertificateKeyFile) {
    properties.sslKey = tlsCertificateKeyFile;
  }

  if (tlsCertificateKeyFilePassword) {
    properties.sslPass = tlsCertificateKeyFilePassword;
  }

  if (tlsCertificateFile) {
    properties.sslCert = tlsCertificateFile;
  }

  properties.sslMethod = optionsToSslMethod(options);
}

function optionsToSslMethod(options: ConnectionOptions): SslMethod {
  const url = new ConnectionString(options.connectionString);
  const searchParams = url.typedSearchParams<MongoClientOptions>();
  const tls = searchParams.get('tls') || searchParams.get('ssl');

  const tlsAllowInvalidCertificates = searchParams.get(
    'tlsAllowInvalidCertificates'
  );
  const tlsAllowInvalidHostnames = searchParams.get('tlsAllowInvalidHostnames');

  const tlsInsecure = searchParams.get('tlsInsecure');
  const tlsCAFile = searchParams.get('tlsCAFile');
  const tlsCertificateKeyFile = searchParams.get('tlsCertificateKeyFile');

  if (tls === 'false') {
    return 'NONE';
  }

  if (tlsCertificateKeyFile) {
    return 'ALL';
  }

  if (tlsCAFile) {
    return 'SERVER';
  }

  if (
    tlsInsecure === 'true' ||
    (tlsAllowInvalidCertificates === 'true' &&
      tlsAllowInvalidHostnames === 'true')
  ) {
    return 'UNVALIDATED';
  }

  return 'SYSTEMCA';
}

// NOTE: MONGODB-AWS was not supported by the old connection model
// users will now be able to use that, we need to remove it so saving
// connection won't fail and MONGODB-AWS connections will appear
// as unauthenticated.
function removeAWSParams(connectionString: string): string {
  const url = new ConnectionString(connectionString);
  const searchParams = url.typedSearchParams<MongoClientOptions>();

  if (searchParams.get('authMechanism') === 'MONGODB-AWS') {
    searchParams.delete('authMechanism');
    searchParams.delete('authMechanismProperties');
  }

  return url.href;
}
