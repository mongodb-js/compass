import _ from 'lodash';
import ConnectionString from 'mongodb-connection-string-url';
import { AuthMechanismProperties } from './auth-mechanism-properties';
import { ConnectionInfo } from './connection-info';

export interface ConnectionSecrets {
  password?: string;
  sshTunnelPassphrase?: string;
  awsSessionToken?: string;
}

const AWS_SESSION_TOKEN_KEY = 'AWS_SESSION_TOKEN';
const AUTH_MECHANISM_PROPERTIES_KEY = 'authMechanismProperties';

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

  if (secrets.awsSessionToken) {
    const authMechanismProperties = new AuthMechanismProperties(
      uri.searchParams.get(AUTH_MECHANISM_PROPERTIES_KEY)
    );

    authMechanismProperties.set(AWS_SESSION_TOKEN_KEY, secrets.awsSessionToken);

    uri.searchParams.set(
      AUTH_MECHANISM_PROPERTIES_KEY,
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

  const authMechanismProperties = new AuthMechanismProperties(
    uri.searchParams.get(AUTH_MECHANISM_PROPERTIES_KEY)
  );

  if (authMechanismProperties.has(AWS_SESSION_TOKEN_KEY)) {
    secrets.awsSessionToken = authMechanismProperties.get(
      AWS_SESSION_TOKEN_KEY
    );
    authMechanismProperties.delete(AWS_SESSION_TOKEN_KEY);

    if (authMechanismProperties.toString()) {
      uri.searchParams.set(
        AUTH_MECHANISM_PROPERTIES_KEY,
        authMechanismProperties.toString()
      );
    } else {
      uri.searchParams.delete('authMechanismProperties');
    }
  }

  connectionInfoWithoutSecrets.connectionOptions.connectionString = uri.href;

  return { connectionInfo: connectionInfoWithoutSecrets, secrets };
}
