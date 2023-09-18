import type { MongoClientOptions, AutoEncryptionOptions } from 'mongodb';
import { isLocalhost } from 'mongodb-build-info';
import type { ConnectionOptions } from 'mongodb-data-service';
import ConnectionString from 'mongodb-connection-string-url';
import type { ConnectionStringParsingOptions } from 'mongodb-connection-string-url';
import { hasAnyCsfleOption } from '../utils/csfle-handler';

export type FieldName =
  | 'connectionString'
  | 'hostname'
  | 'hosts'
  | 'isSrv'
  | 'kerberosPrincipal'
  | 'keyVaultNamespace'
  | 'kmip.endpoint'
  | 'local.key'
  | 'password'
  | 'schema'
  | 'proxyHostname'
  | 'schemaMap'
  | 'encryptedFieldsMap'
  | 'sshHostname'
  | 'sshIdentityKeyFile'
  | 'sshPassword'
  | 'sshUsername'
  | 'tls'
  | 'tlsCertificateKeyFile'
  | 'username';

export type TabId =
  | 'general'
  | 'authentication'
  | 'tls'
  | 'proxy'
  | 'csfle'
  | 'advanced';

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
    ...validateCSFLEErrors(connectionOptions.fleOptions?.autoEncryption ?? {}),
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

function validateCSFLEErrors(
  autoEncryptionOptions: AutoEncryptionOptions
): ConnectionFormError[] {
  const errors: ConnectionFormError[] = [];
  for (const fieldName of ['schemaMap', 'encryptedFieldsMap'] as const) {
    const encryptedFieldConfigError =
      autoEncryptionOptions[fieldName]?.['$compass.error'];
    if (encryptedFieldConfigError) {
      errors.push({
        fieldTab: 'csfle',
        fieldName,
        message: `EncryptedFieldConfig is invalid: ${
          encryptedFieldConfigError as string
        }`,
      });
    }
  }
  if (
    autoEncryptionOptions.keyVaultNamespace &&
    !autoEncryptionOptions.keyVaultNamespace.includes('.')
  ) {
    errors.push({
      fieldTab: 'csfle',
      fieldName: 'keyVaultNamespace',
      message: 'Key Vault namespace must be of the format <db>.<collection>',
    });
  }
  if (
    !autoEncryptionOptions.keyVaultNamespace &&
    hasAnyCsfleOption(autoEncryptionOptions)
  ) {
    errors.push({
      fieldTab: 'csfle',
      fieldName: 'keyVaultNamespace',
      message:
        'Key Vault namespace must be specified for In-Use-Encryption-enabled connections',
    });
  }
  const kmsProviders = autoEncryptionOptions.kmsProviders ?? {};
  if (
    typeof kmsProviders.local?.key === 'string' &&
    !/[a-zA-Z0-9+/-_=]{128}/.test(kmsProviders.local.key)
  ) {
    errors.push({
      fieldTab: 'csfle',
      fieldName: 'local.key',
      message: 'Local key must be a Base64-encoded 96-byte string',
    });
  }
  if (
    typeof kmsProviders.kmip?.endpoint === 'string' &&
    !kmsProviders.kmip?.endpoint.includes(':')
  ) {
    errors.push({
      fieldTab: 'csfle',
      fieldName: 'kmip.endpoint',
      message: 'KMIP endpoint must be of the format <host>:<port>',
    });
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
  try {
    connectionString = new ConnectionString(
      connectionOptions.connectionString,
      {
        looseValidation: true,
      }
    );
  } catch (err: unknown) {
    return [];
  }

  return [
    ...validateReadPreferenceWarnings(connectionString),
    ...validateCertificateValidationWarnings(connectionString),
    ...validateDirectConnectionAndSrvWarnings(connectionString),
    ...validateDirectConnectionAndReplicaSetWarnings(connectionString),
    ...validateDirectConnectionAndMultiHostWarnings(connectionString),
    ...validateTLSAndHostWarnings(connectionString),
    ...validateSocksWarnings(connectionString),
    ...validateCSFLEWarnings(connectionOptions),
  ];
}

function validateCSFLEWarnings(
  connectionOptions: ConnectionOptions
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
  if (connectionOptions.fleOptions?.storeCredentials) {
    warnings.push({
      message:
        'In-Use Encryption KMS provider credentials will be stored to disk.',
    });
  }

  return warnings;
}

function validateCertificateValidationWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
  if (!isSecure(connectionString)) {
    return [];
  }

  const tlsInsecure =
    connectionString.searchParams.get('tlsInsecure') === 'true';
  const tlsAllowInvalidHostnames =
    connectionString.searchParams.get('tlsAllowInvalidHostnames') === 'true';
  const tlsAllowInvalidCertificates =
    connectionString.searchParams.get('tlsAllowInvalidCertificates') === 'true';

  if (tlsInsecure || tlsAllowInvalidHostnames || tlsAllowInvalidCertificates) {
    warnings.push({
      message: `TLS/SSL certificate validation is disabled. If possible, enable certificate validation to avoid security vulnerabilities.`,
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
        'TLS/SSL is disabled. If possible, enable TLS/SSL to avoid security vulnerabilities.',
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
