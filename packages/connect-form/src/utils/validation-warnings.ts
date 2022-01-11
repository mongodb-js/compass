import ConnectionString from 'mongodb-connection-string-url';
import { ConnectionInfo } from 'mongodb-data-service';
import {
  FormValidationWarning,
  getConnectionString,
  isSecure,
} from './validation';
function validateConnectionInfoWarnings(
  connectionInfo: ConnectionInfo
): FormValidationWarning[] {
  const connectionString = getConnectionString(connectionInfo);
  return [
    ...validateAuthMechanism(connectionString),
    ...validateReadPreference(connectionString),
    ...validateDeprecatedOptions(connectionString),
    ...validateCertificateValidation(connectionString),
    ...validateDirectConnectionAndSrv(connectionString),
    ...validateDirectConnectionAndReplicaSet(connectionString),
    ...validateDirectConnectionAndMultiHost(connectionString),
    ...validateSSH(connectionInfo),
    ...validateTLSAndHost(connectionInfo),
  ];
}

function validateCertificateValidation(
  connectionString: ConnectionString
): FormValidationWarning[] {
  const warnings: FormValidationWarning[] = [];
  if (
    isSecure(connectionString) &&
    (connectionString.searchParams.has('tlsInsecure') ||
      connectionString.searchParams.has('tlsAllowInvalidHostnames') ||
      connectionString.searchParams.has('tlsAllowInvalidCertificates'))
  ) {
    warnings.push({
      message:
        'Disabling certificate validation is not recommended as it may create a security vulnerability',
    });
  }

  return warnings;
}
function validateDeprecatedOptions(
  connectionString: ConnectionString
): FormValidationWarning[] {
  const warnings: FormValidationWarning[] = [];
  // tlsCertificateFile
  if (connectionString.searchParams.has('tlsCertificateFile')) {
    warnings.push({
      message:
        'tlsCertificateFile is deprecated and will be removed in future versions of Compass, please embed the client key and certificate chain in a single .pem bundle and use tlsCertificateKeyFile instead.',
    });
  }

  return warnings;
}

function validateReadPreference(
  connectionString: ConnectionString
): FormValidationWarning[] {
  const warnings: FormValidationWarning[] = [];
  const VALID_READ_PREFERENCES = [
    'primary',
    'primaryPreferred',
    'secondary',
    'secondaryPreferred',
    'nearest',
  ];
  const readPreference = connectionString.searchParams.get('readPreference');
  if (readPreference && !VALID_READ_PREFERENCES.includes(readPreference)) {
    warnings.push({
      message: `Unknown read preference ${readPreference}`,
    });
  }
  return warnings;
}

function validateAuthMechanism(
  connectionString: ConnectionString
): FormValidationWarning[] {
  const warnings: FormValidationWarning[] = [];
  const authMechanism =
    connectionString.searchParams.get('authMechanism') || '';
  switch (authMechanism.toUpperCase()) {
    case '':
      break;
    case 'SCRAM-SHA-1':
    case 'SCRAM-SHA-256':
      break;
    case 'GSSAPI':
      if (connectionString.password) {
        warnings.push({
          message: 'The password is ignored with Kerberos.',
        });
      }
      break;
    default:
      warnings.push({
        message: `Unknown authentication mechanism ${authMechanism}`,
      });
  }
  return warnings;
}

function validateDirectConnectionAndSrv(
  connectionString: ConnectionString
): FormValidationWarning[] {
  const warnings: FormValidationWarning[] = [];
  if (
    connectionString.isSRV &&
    connectionString.searchParams.get('directConnection') === 'true'
  ) {
    warnings.push({
      message: 'directConnection not supported with SRV URI.',
    });
  }
  return warnings;
}

function validateDirectConnectionAndReplicaSet(
  connectionString: ConnectionString
): FormValidationWarning[] {
  const warnings: FormValidationWarning[] = [];
  if (
    connectionString.searchParams.get('replicaSet') &&
    connectionString.searchParams.get('directConnection') === 'true'
  ) {
    warnings.push({
      message: 'directConnection is not supported with replicaSet.',
    });
  }
  return warnings;
}

function validateDirectConnectionAndMultiHost(
  connectionString: ConnectionString
): FormValidationWarning[] {
  const warnings: FormValidationWarning[] = [];
  if (
    connectionString.hosts.length > 1 &&
    connectionString.searchParams.get('directConnection') === 'true'
  ) {
    warnings.push({
      message: 'directConnection is not supported with multiple hosts.',
    });
  }
  return warnings;
}

function validateSSH(connectionInfo: ConnectionInfo): FormValidationWarning[] {
  const warnings: FormValidationWarning[] = [];
  const connectionString = getConnectionString(connectionInfo);
  if (
    connectionInfo.connectionOptions.sshTunnel &&
    connectionString.searchParams.get('directConnection') !== 'true'
  ) {
    warnings.push({
      message:
        'directConnection is recommended when connecting through SSH tunnel.',
    });
  }
  return warnings;
}

function validateTLSAndHost(
  connectionInfo: ConnectionInfo
): FormValidationWarning[] {
  const warnings: FormValidationWarning[] = [];
  const connectionString = getConnectionString(connectionInfo);
  if (connectionString.host !== 'localhost' && !isSecure(connectionString)) {
    warnings.push({
      message:
        'Connecting without tls is not recommended as it may create a security vulnerability.',
    });
  }
  return warnings;
}

export { validateConnectionInfoWarnings };
