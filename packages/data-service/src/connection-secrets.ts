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
}

const AWS_SESSION_TOKEN_PROPERTY = 'AWS_SESSION_TOKEN';
const AUTH_MECHANISM_PROPERTIES_PARAM = 'authMechanismProperties';
const TLS_CERTIFICATE_KEY_FILE_PASSWORD_PARAM = 'tlsCertificateKeyFilePassword';

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
      TLS_CERTIFICATE_KEY_FILE_PASSWORD_PARAM,
      secrets.tlsCertificateKeyFilePassword
    );
  }

  if (secrets.awsSessionToken) {
    const authMechanismProperties = new CommaAndColonSeparatedRecord(
      uri.searchParams.get(AUTH_MECHANISM_PROPERTIES_PARAM)
    );

    authMechanismProperties.set(
      AWS_SESSION_TOKEN_PROPERTY,
      secrets.awsSessionToken
    );

    uri.searchParams.set(
      AUTH_MECHANISM_PROPERTIES_PARAM,
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

  if (uri.searchParams.has(TLS_CERTIFICATE_KEY_FILE_PASSWORD_PARAM)) {
    secrets.tlsCertificateKeyFilePassword =
      uri.searchParams.get(TLS_CERTIFICATE_KEY_FILE_PASSWORD_PARAM) ||
      undefined;
    uri.searchParams.delete(TLS_CERTIFICATE_KEY_FILE_PASSWORD_PARAM);
  }

  const authMechanismProperties = new CommaAndColonSeparatedRecord(
    uri.searchParams.get(AUTH_MECHANISM_PROPERTIES_PARAM)
  );

  if (authMechanismProperties.has(AWS_SESSION_TOKEN_PROPERTY)) {
    secrets.awsSessionToken = authMechanismProperties.get(
      AWS_SESSION_TOKEN_PROPERTY
    );
    authMechanismProperties.delete(AWS_SESSION_TOKEN_PROPERTY);

    if (authMechanismProperties.toString()) {
      uri.searchParams.set(
        AUTH_MECHANISM_PROPERTIES_PARAM,
        authMechanismProperties.toString()
      );
    } else {
      uri.searchParams.delete(AUTH_MECHANISM_PROPERTIES_PARAM);
    }
  }

  connectionInfoWithoutSecrets.connectionOptions.connectionString = uri.href;

  return { connectionInfo: connectionInfoWithoutSecrets, secrets };
}
