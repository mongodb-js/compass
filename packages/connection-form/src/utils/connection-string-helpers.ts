import type { MongoClientOptions } from 'mongodb';
import ConnectionStringUrl, {
  CommaAndColonSeparatedRecord,
} from 'mongodb-connection-string-url';

export interface AuthMechanismProperties {
  SERVICE_NAME?: string;
  SERVICE_REALM?: string;
  CANONICALIZE_HOST_NAME?: boolean;
  AWS_SESSION_TOKEN?: string;
}

export function parseAuthMechanismProperties(
  connectionString: ConnectionStringUrl
): CommaAndColonSeparatedRecord<AuthMechanismProperties> {
  const searchParams = connectionString.typedSearchParams<MongoClientOptions>();
  const authMechanismPropertiesString = searchParams.get(
    'authMechanismProperties'
  );
  try {
    return new CommaAndColonSeparatedRecord<AuthMechanismProperties>(
      authMechanismPropertiesString
    );
  } catch (e) {
    return new CommaAndColonSeparatedRecord<AuthMechanismProperties>();
  }
}

export function tryToParseConnectionString(
  connectionString: string
): [ConnectionStringUrl, undefined] | [undefined, Error] {
  try {
    const connectionStringUrl = new ConnectionStringUrl(connectionString, {
      looseValidation: true,
    });
    return [connectionStringUrl, undefined];
  } catch (err) {
    return [undefined, err as Error];
  }
}

export function getConnectionStringUsername(
  connectionStringUrl: ConnectionStringUrl
): string {
  return decodeURIComponent(connectionStringUrl.username);
}

export function getConnectionStringPassword(
  connectionStringUrl: ConnectionStringUrl
): string {
  return decodeURIComponent(connectionStringUrl.password);
}

export function setConnectionStringUsername(
  connectionStringUrl: ConnectionStringUrl,
  username: string
): ConnectionStringUrl {
  const updated = connectionStringUrl.clone();
  updated.username = encodeURIComponent(username);
  return updated;
}

export function setConnectionStringPassword(
  connectionStringUrl: ConnectionStringUrl,
  password: string
): ConnectionStringUrl {
  const updated = connectionStringUrl.clone();
  updated.password = encodeURIComponent(password);
  return updated;
}
