import _ from 'lodash';
import ConnectionString, {
  CommaAndColonSeparatedRecord,
} from 'mongodb-connection-string-url';
import type { ConnectionInfo } from './connection-info';
import type {
  Document,
  MongoClientOptions,
  AuthMechanismProperties,
  AutoEncryptionOptions,
} from 'mongodb';

export interface ConnectionSecrets {
  password?: string;
  sshTunnelPassword?: string;
  sshTunnelPassphrase?: string;
  awsSessionToken?: string;
  tlsCertificateKeyFilePassword?: string;
  proxyPassword?: string;
  autoEncryption?: AutoEncryptionOptions;
  oidcSerializedState?: string;
}

export function mergeSecrets(
  connectionInfo: Readonly<ConnectionInfo>,
  secrets: ConnectionSecrets | undefined
): ConnectionInfo {
  const connectionInfoWithSecrets = _.cloneDeep(connectionInfo);

  if (!secrets) {
    return connectionInfoWithSecrets;
  }

  const connectionOptions = connectionInfoWithSecrets.connectionOptions;

  const uri = new ConnectionString(connectionOptions.connectionString);

  const searchParams = uri.typedSearchParams<MongoClientOptions>();

  if (secrets.password) {
    uri.password = secrets.password;
  }

  if (secrets.sshTunnelPassword && connectionOptions.sshTunnel) {
    connectionOptions.sshTunnel.password = secrets.sshTunnelPassword;
  }

  if (secrets.sshTunnelPassphrase && connectionOptions.sshTunnel) {
    connectionOptions.sshTunnel.identityKeyPassphrase =
      secrets.sshTunnelPassphrase;
  }

  if (secrets.autoEncryption && connectionOptions.fleOptions?.autoEncryption) {
    _.merge(
      connectionOptions.fleOptions.autoEncryption,
      secrets.autoEncryption
    );
  }

  if (secrets.oidcSerializedState) {
    connectionInfoWithSecrets.connectionOptions.oidc ??= {};
    connectionInfoWithSecrets.connectionOptions.oidc.serializedState =
      secrets.oidcSerializedState;
  }

  if (secrets.tlsCertificateKeyFilePassword) {
    searchParams.set(
      'tlsCertificateKeyFilePassword',
      secrets.tlsCertificateKeyFilePassword
    );
  }

  if (secrets.proxyPassword) {
    searchParams.set('proxyPassword', secrets.proxyPassword);
  }

  if (secrets.awsSessionToken) {
    const authMechanismProperties =
      new CommaAndColonSeparatedRecord<AuthMechanismProperties>(
        searchParams.get('authMechanismProperties')
      );

    authMechanismProperties.set('AWS_SESSION_TOKEN', secrets.awsSessionToken);

    searchParams.set(
      'authMechanismProperties',
      authMechanismProperties.toString()
    );
  }

  connectionInfoWithSecrets.connectionOptions.connectionString = uri.href;

  return connectionInfoWithSecrets;
}

export function extractSecrets(connectionInfo: Readonly<ConnectionInfo>): {
  connectionInfo: ConnectionInfo;
  secrets: ConnectionSecrets;
} {
  const connectionInfoWithoutSecrets = _.cloneDeep(connectionInfo);
  const secrets: ConnectionSecrets = {};

  const connectionOptions = connectionInfoWithoutSecrets.connectionOptions;
  const uri = new ConnectionString(connectionOptions.connectionString);
  const searchParams = uri.typedSearchParams<MongoClientOptions>();

  if (uri.password) {
    secrets.password = uri.password;
    uri.password = '';
  }

  if (connectionOptions.sshTunnel?.password) {
    secrets.sshTunnelPassword = connectionOptions.sshTunnel.password;
    delete connectionOptions.sshTunnel.password;
  }

  if (connectionOptions.sshTunnel?.identityKeyPassphrase) {
    secrets.sshTunnelPassphrase =
      connectionOptions.sshTunnel.identityKeyPassphrase;
    delete connectionOptions.sshTunnel.identityKeyPassphrase;
  }

  if (searchParams.has('tlsCertificateKeyFilePassword')) {
    secrets.tlsCertificateKeyFilePassword =
      searchParams.get('tlsCertificateKeyFilePassword') || undefined;
    searchParams.delete('tlsCertificateKeyFilePassword');
  }

  if (searchParams.has('proxyPassword')) {
    secrets.proxyPassword = searchParams.get('proxyPassword') || undefined;
    searchParams.delete('proxyPassword');
  }

  const authMechanismProperties =
    new CommaAndColonSeparatedRecord<AuthMechanismProperties>(
      searchParams.get('authMechanismProperties')
    );

  if (authMechanismProperties.has('AWS_SESSION_TOKEN')) {
    secrets.awsSessionToken = authMechanismProperties.get('AWS_SESSION_TOKEN');
    authMechanismProperties.delete('AWS_SESSION_TOKEN');

    if (authMechanismProperties.toString()) {
      searchParams.set(
        'authMechanismProperties',
        authMechanismProperties.toString()
      );
    } else {
      searchParams.delete('authMechanismProperties');
    }
  }

  connectionInfoWithoutSecrets.connectionOptions.connectionString = uri.href;

  if (connectionOptions.fleOptions?.autoEncryption) {
    const { autoEncryption } = connectionOptions.fleOptions;
    const {
      data: autoEncryptionWithoutSecrets,
      secrets: autoEncryptionSecrets,
    } = extractAutoEncryptionSecrets(autoEncryption);
    connectionOptions.fleOptions.autoEncryption = autoEncryptionWithoutSecrets;
    // Remove potentially empty KMS provider options objects,
    // since libmongocrypt assumes that, if a KMS provider options
    // object is present but empty, the caller will be able
    // to provide credentials on demand.
    if (connectionOptions.fleOptions.autoEncryption.kmsProviders)
      connectionOptions.fleOptions.autoEncryption.kmsProviders =
        omitPropertiesWhoseValuesAreEmptyObjects(
          connectionOptions.fleOptions.autoEncryption.kmsProviders
        );
    if (connectionOptions.fleOptions.storeCredentials) {
      secrets.autoEncryption = autoEncryptionSecrets;
    }
  }

  if (connectionOptions.oidc?.serializedState) {
    secrets.oidcSerializedState = connectionOptions.oidc.serializedState;
    delete connectionOptions.oidc.serializedState;
  }

  return { connectionInfo: connectionInfoWithoutSecrets, secrets };
}

function omitPropertiesWhoseValuesAreEmptyObjects<T extends Document>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => Object.keys(value ?? {}).length > 0
    )
  ) as { [k in keyof T]: Exclude<T[k], Record<string, never>> };
}

const KMS_PROVIDER_SECRET_PATHS = {
  local: ['key'],
  aws: ['secretAccessKey', 'sessionToken'],
  azure: ['clientSecret'],
  gcp: ['privateKey'],
  // kmip does not have any kms secrets, but tlsOptions
  kmip: undefined,
};

type AutoEncryptionKMSAndTLSOptions = Partial<
  Pick<AutoEncryptionOptions, 'kmsProviders' | 'tlsOptions'>
>;

function extractAutoEncryptionSecrets(data: AutoEncryptionOptions): {
  data: AutoEncryptionOptions & AutoEncryptionKMSAndTLSOptions;
  secrets: AutoEncryptionKMSAndTLSOptions;
} {
  const secrets: AutoEncryptionKMSAndTLSOptions = {};
  // Secrets are stored in a kmsProviders and tlsOptions
  const { kmsProviders, tlsOptions, ...result } = data;

  for (const kmsProviderName of Object.keys(kmsProviders ?? {})) {
    const key = kmsProviderName.split(':')[0] as
      | keyof typeof KMS_PROVIDER_SECRET_PATHS
      | undefined;
    if (!key) {
      continue;
    }

    const data = (kmsProviders ?? {})[
      kmsProviderName as keyof typeof kmsProviders
    ];
    const secretPaths = KMS_PROVIDER_SECRET_PATHS[key];
    if (!secretPaths) {
      continue;
    }
    _.set(
      secrets,
      `kmsProviders.${kmsProviderName}`,
      _.pick(data, secretPaths)
    );
    for (const secretKey of secretPaths) {
      _.unset(data, secretKey);
    }
  }

  for (const key of Object.keys(tlsOptions ?? {})) {
    const data = (tlsOptions ?? {})[key];
    if (data?.tlsCertificateKeyFilePassword) {
      _.set(secrets, `tlsOptions.${key}`, {
        tlsCertificateKeyFilePassword: data.tlsCertificateKeyFilePassword,
      });
      delete data.tlsCertificateKeyFilePassword;
    }
  }

  return { data: _.merge(result, { kmsProviders, tlsOptions }), secrets };
}
