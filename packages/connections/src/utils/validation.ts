import { ConnectionInfo } from 'mongodb-data-service';
import { validateConnectionInfoErrors } from './validation-errors';
import { validateConnectionInfoWarnings } from './validation-warnings';
import ConnectionString from 'mongodb-connection-string-url';

export type FormFieldName =
  | 'username'
  | 'password'
  | 'hostname'
  | 'kerberosPrincipal'
  | 'ldapUsername'
  | 'ldapPassword'
  | 'schema'
  | 'sshHostname'
  | 'sshUsername'
  | 'sshPassword';

export type FormValidationError = {
  message: string;
  field?: FormFieldName;
};

export type FormValidationWarning = FormValidationError;

export { validateConnectionInfoErrors, validateConnectionInfoWarnings };

export function getConnectionString(
  connectionInfo: ConnectionInfo
): ConnectionString {
  return new ConnectionString(
    connectionInfo.connectionOptions.connectionString
  );
}

export function isSecure(connectionString: ConnectionString): boolean {
  const sslParam = connectionString.searchParams.get('ssl');
  const tlsParam = connectionString.searchParams.get('tls');
  if (!sslParam && !tlsParam) {
    return connectionString.isSRV;
  }

  return sslParam === 'true' || tlsParam === 'true';
}
