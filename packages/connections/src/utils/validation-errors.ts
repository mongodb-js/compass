import { ConnectionInfo } from 'mongodb-data-service';
import ConnectionString from 'mongodb-connection-string-url';
import {
  FormValidationError,
  getConnectionString,
  isSecure,
} from './validation';

import type { MongoClientOptions } from 'mongodb';
function validateConnectionInfoErrors(
  connectionInfo: ConnectionInfo
): FormValidationError[] {
  const connectionString = getConnectionString(connectionInfo);

  return [
    ...validateAuthMechanism(connectionString),
    ...validateSSHTunnel(connectionInfo),
  ];
}

function validateAuthMechanism(
  connectionString: ConnectionString
): FormValidationError[] {
  const errors: FormValidationError[] = [];
  const authMechanism = connectionString
    .typedSearchParams<MongoClientOptions>()
    .get('authMechanism');
  switch ((authMechanism || '').toUpperCase()) {
    case '':
      return [];
    case 'MONGODB-X509':
      return validateX509(connectionString);
    case 'GSSAPI':
      return validateKerberosPrincipal(connectionString);
    case 'PLAIN':
      return validateLDAP(connectionString);
    case 'SCRAM-SHA-1':
    case 'SCRAM-SHA-256':
      return validateScramSha(connectionString);
    default:
      return errors;
  }
}

function validateScramSha(
  connectionString: ConnectionString
): FormValidationError[] {
  const errors: FormValidationError[] = [];

  const { username, password } = connectionString;
  if (!username) {
    errors.push({
      field: 'username',
      message: 'Username is missing.',
    });
  }

  if (!password) {
    errors.push({
      field: 'password',
      message: 'Password is missing.',
    });
  }
  return errors;
}

function validateX509(
  connectionString: ConnectionString
): FormValidationError[] {
  const errors: FormValidationError[] = [];
  if (!isSecure(connectionString)) {
    errors.push({
      message: 'TLS must be enabled in order to use x509 authentication.',
    });
  }
  if (!connectionString.searchParams.has('tlsCertificateFile')) {
    errors.push({
      message: 'A Client Certificate is required with x509 authentication.',
    });
  }
  return errors;
}

function validateLDAP(
  connectionString: ConnectionString
): FormValidationError[] {
  const errors: FormValidationError[] = [];
  if (connectionString.searchParams.get('authMechanism') === 'PLAIN') {
    if (!connectionString.username) {
      errors.push({
        field: 'ldapUsername',
        message: 'LDAP username is required.',
      });
    }

    if (!connectionString.password) {
      errors.push({
        message: 'Username and password are required.',
      });
    }
  }
  return errors;
}
function validateKerberosPrincipal(
  connectionString: ConnectionString
): FormValidationError[] {
  const errors: FormValidationError[] = [];
  if (!connectionString.username) {
    errors.push({
      field: 'kerberosPrincipal',
      message: 'Principal name is required with Kerberos.',
    });
  }
  return errors;
}
function validateSSHTunnel(
  connectionInfo: ConnectionInfo
): FormValidationError[] {
  const connectionOptions = connectionInfo.connectionOptions;
  if (!connectionOptions.sshTunnel) {
    return [];
  }
  const errors: FormValidationError[] = [];
  if (!connectionOptions.sshTunnel.host) {
    errors.push({
      field: 'sshHostname',
      message: 'A hostname is required to connect with an SSH tunnel',
    });
  }

  if (
    !connectionOptions.sshTunnel.password &&
    !connectionOptions.sshTunnel.identityKeyFile
  ) {
    errors.push({
      message:
        'When connecting via SSH tunnel either password or identity file is required',
    });
  }
  return errors;
}

export { validateConnectionInfoErrors };
