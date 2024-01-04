import _ from 'lodash';
import ConnectionString, {
  CommaAndColonSeparatedRecord,
} from 'mongodb-connection-string-url';
import type { ConnectionInfo } from './connection-info';
import type {
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
    const kmsProviders = ['aws', 'local', 'azure', 'gcp', 'kmip'] as const;
    const secretPaths = [
      'kmsProviders.aws.secretAccessKey',
      'kmsProviders.aws.sessionToken',
      'kmsProviders.local.key',
      'kmsProviders.azure.clientSecret',
      'kmsProviders.gcp.privateKey',
      ...kmsProviders.map(
        (p) => `tlsOptions.${p}.tlsCertificateKeyFilePassword`
      ),
    ];
    connectionOptions.fleOptions.autoEncryption = _.omit(
      autoEncryption,
      secretPaths
    );
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
      secrets.autoEncryption = _.pick(autoEncryption, secretPaths);
    }
  }

  if (connectionOptions.oidc?.serializedState) {
    secrets.oidcSerializedState = connectionOptions.oidc.serializedState;
    delete connectionOptions.oidc.serializedState;
  }

  return { connectionInfo: connectionInfoWithoutSecrets, secrets };
}

function omitPropertiesWhoseValuesAreEmptyObjects<
  T extends Record<string, Record<string, unknown>>
>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => Object.keys(value).length > 0)
  ) as Partial<T>;
}
