import type { MongoClientOptions } from 'mongodb';
import { isLocalhost } from 'mongodb-build-info';
import type { ConnectionOptions } from 'mongodb-data-service';
import ConnectionString from 'mongodb-connection-string-url';
import type { ConnectionStringParsingOptions } from 'mongodb-connection-string-url';

export type FieldName =
  | 'connectionString'
  | 'hostname'
  | 'hosts'
  | 'isSrv'
  | 'kerberosPrincipal'
  | 'password'
  | 'schema'
  | 'proxyHostname'
  | 'sshHostname'
  | 'sshIdentityKeyFile'
  | 'sshPassword'
  | 'sshUsername'
  | 'tls'
  | 'tlsCertificateKeyFile'
  | 'username';

export type TabId = 'general' | 'authentication' | 'tls' | 'proxy' | 'advanced';

type ConnectionFormErrorWithField = {
  fieldName: FieldName;
  fieldTab: TabId;
  fieldIndex?: number;
  message: string;
};
type ConnectionFormErrorWithoutField = {
  fieldName?: never;
  fieldTab?: never;
  fieldIndex?: never;
  message: string;
};
export type ConnectionFormError =
  | ConnectionFormErrorWithField
  | ConnectionFormErrorWithoutField;
export interface ConnectionFormWarning {
  message: string;
}

export function errorsByFieldTab(
  errors: ConnectionFormError[],
  tabId: TabId
): ConnectionFormError[] {
  return errors.filter((error) => error.fieldTab === tabId);
}

export function errorMessageByFieldName(
  errors: ConnectionFormError[],
  fieldName: FieldName
): string | undefined {
  return (errors || []).find((err) => err.fieldName === fieldName)?.message;
}

export function fieldNameHasError(
  errors: ConnectionFormError[],
  fieldName: FieldName
): boolean {
  return !!errorMessageByFieldName(errors, fieldName);
}

export function errorMessageByFieldNameAndIndex(
  errors: ConnectionFormError[],
  fieldName: FieldName,
  fieldIndex: number
): string | undefined {
  return (errors || []).find(
    (err) => err.fieldName === fieldName && err.fieldIndex === fieldIndex
  )?.message;
}

export function validateConnectionOptionsErrors(
  connectionOptions: ConnectionOptions,
  parsingOptions?: ConnectionStringParsingOptions
): ConnectionFormError[] {
  const connectionString = new ConnectionString(
    connectionOptions.connectionString,
    { looseValidation: true, ...parsingOptions }
  );

  return [
    ...validateAuthMechanismErrors(connectionString),
    ...(connectionOptions.sshTunnel
      ? validateSSHTunnelErrors(connectionOptions.sshTunnel)
      : validateSocksProxyErrors(connectionString)),
  ];
}

function validateAuthMechanismErrors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  const authMechanism = connectionString
    .typedSearchParams<MongoClientOptions>()
    .get('authMechanism');
  switch ((authMechanism || '').toUpperCase()) {
    case '':
      return validateDefaultAuthMechanismErrors(connectionString);
    case 'MONGODB-X509':
      return validateX509Errors(connectionString);
    case 'GSSAPI':
      return validateKerberosErrors(connectionString);
    case 'PLAIN':
      return validateLDAPErrors(connectionString);
    case 'SCRAM-SHA-1':
    case 'SCRAM-SHA-256':
      return validateScramShaErrors(connectionString);
    default:
      return [];
  }
}

function validateScramShaErrors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  return validateUsernameAndPasswordErrors(connectionString);
}

function validateDefaultAuthMechanismErrors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  const { username, password } = connectionString;
  if (!username && !password) {
    return [];
  }
  return validateUsernameAndPasswordErrors(connectionString);
}

function validateUsernameAndPasswordErrors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  const { username, password } = connectionString;
  const errors: ConnectionFormError[] = [];
  if (!username) {
    errors.push({
      fieldTab: 'authentication',
      fieldName: 'username',
      message: 'Username is missing.',
    });
  }

  if (!password) {
    errors.push({
      fieldTab: 'authentication',
      fieldName: 'password',
      message: 'Password is missing.',
    });
  }
  return errors;
}
function validateX509Errors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  const errors: ConnectionFormError[] = [];
  if (!isSecure(connectionString)) {
    errors.push({
      fieldTab: 'tls',
      fieldName: 'tls',
      message: 'TLS must be enabled in order to use x509 authentication.',
    });
  }
  if (!connectionString.searchParams.has('tlsCertificateKeyFile')) {
    errors.push({
      fieldTab: 'tls',
      fieldName: 'tlsCertificateKeyFile',
      message: 'A Client Certificate is required with x509 authentication.',
    });
  }
  return errors;
}

function validateLDAPErrors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  return validateUsernameAndPasswordErrors(connectionString);
}
function validateKerberosErrors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  const errors: ConnectionFormError[] = [];
  if (!connectionString.username) {
    errors.push({
      fieldTab: 'authentication',
      fieldName: 'kerberosPrincipal',
      message: 'Principal name is required with Kerberos.',
    });
  }
  return errors;
}

function validateSSHTunnelErrors(
  sshTunnel: NonNullable<ConnectionOptions['sshTunnel']>
): ConnectionFormError[] {
  const errors: ConnectionFormError[] = [];
  if (!sshTunnel.host) {
    errors.push({
      fieldTab: 'proxy',
      fieldName: 'sshHostname',
      message: 'A hostname is required to connect with an SSH tunnel.',
    });
  }

  if (!sshTunnel.password && !sshTunnel.identityKeyFile) {
    errors.push({
      fieldTab: 'proxy',
      fieldName: 'sshPassword',
      message:
        'When connecting via SSH tunnel either password or identity file is required.',
    });
  }

  if (sshTunnel.identityKeyPassphrase && !sshTunnel.identityKeyFile) {
    errors.push({
      fieldTab: 'proxy',
      fieldName: 'sshIdentityKeyFile',
      message: 'File is required along with passphrase.',
    });
  }

  return errors;
}
function validateSocksProxyErrors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  const searchParams = connectionString.typedSearchParams<MongoClientOptions>();

  const proxyHost = searchParams.get('proxyHost');
  const proxyPort = searchParams.get('proxyPort');
  const proxyUsername = searchParams.get('proxyUsername');
  const proxyPassword = searchParams.get('proxyPassword');

  const errors: ConnectionFormError[] = [];
  if (!proxyHost && (proxyPort || proxyUsername || proxyPassword)) {
    errors.push({
      fieldTab: 'proxy',
      fieldName: 'proxyHostname',
      message: 'Proxy hostname is required.',
    });
    return errors;
  }
  return errors;
}

export function isSecure(connectionString: ConnectionString): boolean {
  const sslParam = connectionString.searchParams.get('ssl');
  const tlsParam = connectionString.searchParams.get('tls');
  if (!sslParam && !tlsParam) {
    return connectionString.isSRV;
  }

  return sslParam === 'true' || tlsParam === 'true';
}

export function validateConnectionOptionsWarnings(
  connectionOptions: ConnectionOptions
): ConnectionFormWarning[] {
  let connectionString: ConnectionString;
  let parserWarning: ConnectionFormWarning[] = [];
  try {
    connectionString = new ConnectionString(connectionOptions.connectionString);
  } catch (err: any) {
    parserWarning = [{ message: err.message }];
    connectionString = new ConnectionString(
      connectionOptions.connectionString,
      {
        looseValidation: true,
      }
    );
  }

  return [
    ...parserWarning,
    ...validateReadPreferenceWarnings(connectionString),
    ...validateDeprecatedOptionsWarnings(connectionString),
    ...validateCertificateValidationWarnings(connectionString),
    ...validateDirectConnectionAndSrvWarnings(connectionString),
    ...validateDirectConnectionAndReplicaSetWarnings(connectionString),
    ...validateDirectConnectionAndMultiHostWarnings(connectionString),
    ...validateTLSAndHostWarnings(connectionString),
    ...validateSocksWarnings(connectionString),
  ];
}

function validateCertificateValidationWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
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
function validateDeprecatedOptionsWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
  if (connectionString.searchParams.has('tlsCertificateFile')) {
    warnings.push({
      message:
        'tlsCertificateFile is deprecated and will be removed in future versions of Compass, please embed the client key and certificate chain in a single .pem bundle and use tlsCertificateKeyFile instead.',
    });
  }

  return warnings;
}

function validateReadPreferenceWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
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

function validateDirectConnectionAndSrvWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
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

function validateDirectConnectionAndReplicaSetWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
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

function validateDirectConnectionAndMultiHostWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
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

function validateTLSAndHostWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];

  const nonLocalhostsCount = connectionString.hosts.filter(
    (host) => !isLocalhost(host)
  ).length;

  if (nonLocalhostsCount && !isSecure(connectionString)) {
    warnings.push({
      message:
        'Connecting without tls is not recommended as it may create a security vulnerability.',
    });
  }
  return warnings;
}

function validateSocksWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];

  const searchParams = connectionString.typedSearchParams<MongoClientOptions>();
  const proxyHost = searchParams.get('proxyHost');

  if (!proxyHost || isLocalhost(proxyHost)) {
    return warnings;
  }

  if (searchParams.get('proxyPassword')) {
    warnings.push({
      message: 'Socks5 proxy password will be transmitted in plaintext.',
    });
  }

  if (connectionString.hosts.find(isLocalhost)) {
    warnings.push({
      message: 'Using remote proxy with local MongoDB service host.',
    });
  }

  return warnings;
}
