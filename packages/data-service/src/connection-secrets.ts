import _ from 'lodash';
import ConnectionString, {
  CommaAndColonSeparatedRecord,
} from 'mongodb-connection-string-url';
import { ConnectionInfo } from './connection-info';

export interface ConnectionSecrets {
  password?: string;
  sshTunnelPassphrase?: string;
  awsSessionToken?: string;
  tlsCertificateKeyFilePassword?: string;
  proxyPassword?: string;
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

  if (secrets.password) {
    uri.password = secrets.password;
  }

  if (secrets.sshTunnelPassphrase && connectionOptions.sshTunnel) {
    connectionOptions.sshTunnel.identityKeyPassphrase =
      secrets.sshTunnelPassphrase;
  }

  if (secrets.tlsCertificateKeyFilePassword) {
    uri.searchParams.set(
      'tlsCertificateKeyFilePassword',
      secrets.tlsCertificateKeyFilePassword
    );
  }

  if (secrets.proxyPassword) {
    uri.searchParams.set('proxyPassword', secrets.proxyPassword);
  }

  if (secrets.awsSessionToken) {
    const authMechanismProperties = new CommaAndColonSeparatedRecord(
      uri.searchParams.get('authMechanismProperties')
    );

    authMechanismProperties.set('AWS_SESSION_TOKEN', secrets.awsSessionToken);

    uri.searchParams.set(
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

  if (uri.password) {
    secrets.password = uri.password;
    uri.password = '';
  }

  if (connectionOptions.sshTunnel?.identityKeyPassphrase) {
    secrets.sshTunnelPassphrase =
      connectionOptions.sshTunnel.identityKeyPassphrase;
    delete connectionOptions.sshTunnel.identityKeyPassphrase;
  }

  if (uri.searchParams.has('tlsCertificateKeyFilePassword')) {
    secrets.tlsCertificateKeyFilePassword =
      uri.searchParams.get('tlsCertificateKeyFilePassword') || undefined;
    uri.searchParams.delete('tlsCertificateKeyFilePassword');
  }

  if (uri.searchParams.has('proxyPassword')) {
    secrets.proxyPassword = uri.searchParams.get('proxyPassword') || undefined;
    uri.searchParams.delete('proxyPassword');
  }

  const authMechanismProperties = new CommaAndColonSeparatedRecord(
    uri.searchParams.get('authMechanismProperties')
  );

  if (authMechanismProperties.has('AWS_SESSION_TOKEN')) {
    secrets.awsSessionToken = authMechanismProperties.get('AWS_SESSION_TOKEN');
    authMechanismProperties.delete('AWS_SESSION_TOKEN');

    if (authMechanismProperties.toString()) {
      uri.searchParams.set(
        'authMechanismProperties',
        authMechanismProperties.toString()
      );
    } else {
      uri.searchParams.delete('authMechanismProperties');
    }
  }

  connectionInfoWithoutSecrets.connectionOptions.connectionString = uri.href;

  return { connectionInfo: connectionInfoWithoutSecrets, secrets };
}
