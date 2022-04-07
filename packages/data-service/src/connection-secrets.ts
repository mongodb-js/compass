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
      connectionOptions.fleOptions?.autoEncryption,
      secrets.autoEncryption
    );
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
    if (connectionOptions.fleOptions.storeCredentials) {
      secrets.autoEncryption = _.pick(autoEncryption, secretPaths);
    }
  }

  return { connectionInfo: connectionInfoWithoutSecrets, secrets };
}
