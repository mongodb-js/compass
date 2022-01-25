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
