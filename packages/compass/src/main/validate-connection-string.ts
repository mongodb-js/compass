import ConnectionStringUrl, {
  CommaAndColonSeparatedRecord,
  redactConnectionString,
} from 'mongodb-connection-string-url';
import type { MongoClientOptions, AuthMechanismProperties } from 'mongodb';
import { createLogger } from '@mongodb-js/compass-logging';
import { isLocalhost } from 'mongodb-build-info';

const { log, mongoLogId } = createLogger('VALIDATE-CONNECTION-STRING-UTIL');

const allowedConnectionStringOptions = [
  'appName',
  'authMechanism',
  'authMechanismProperties', // Partially. See allowed and disallowed AuthMechanismProperties below.
  'authSource',
  'autoSelectFamily',
  'autoSelectFamilyAttemptTimeout',
  'bsonRegExp',
  'cert',
  'checkKeys',
  'compressors',
  'connectTimeoutMS',
  'directConnection',
  'driverInfo',
  'enableUtf8Validation',
  'family',
  'fieldsAsRaw',
  'forceServerObjectId',
  'heartbeatFrequencyMS',
  'hints',
  'ignoreUndefined',
  'journal',
  'key',
  'loadBalanced',
  'localAddress',
  'localPort',
  'localThresholdMS',
  'maxConnecting',
  'maxIdleTimeMS',
  'maxPoolSize',
  'maxStalenessSeconds',
  'minHeartbeatFrequencyMS',
  'minPoolSize',
  'monitorCommands',
  'noDelay',
  'passphrase',
  'pfx',
  'promoteBuffers',
  'promoteLongs',
  'promoteValues',
  'proxyPassword',
  'proxyUsername',
  'readConcern',
  'readConcernLevel',
  'readPreference',
  'readPreferenceTags',
  'replicaSet',
  'retryReads',
  'retryWrites',
  'serverApi',
  'serverMonitoringMode',
  'serverSelectionTimeoutMS',
  'socketTimeoutMS',
  'srvMaxHosts',
  'srvServiceName',
  'ssl', // Only if value is `true` or target host is local.
  'timeoutMS',
  'tls', // Only if value is `true` or target host is local.
  'tlsCertificateKeyFile',
  'tlsCertificateKeyFilePassword',
  'tlsCRLFile',
  'useBigInt64',
  'w',
  'waitQueueTimeoutMS',
  'writeConcern',
  'wtimeoutMS',
  'zlibCompressionLevel',
] as const;

const disallowedConnectionStringOptions = [
  'allowPartialTrustChain',
  'ALPNProtocols',
  'auth',
  'autoEncryption',
  'ca',
  'checkServerIdentity',
  'ciphers',
  'crl',
  'ecdhCurve',
  'lookup',
  'minDHSize',
  'pkFactory',
  'proxyHost',
  'proxyPort',
  'raw',
  'rejectUnauthorized',
  'secureContext',
  'secureProtocol',
  'serializeFunctions',
  'servername',
  'session',
  'tlsAllowInvalidCertificates',
  'tlsAllowInvalidHostnames',
  'tlsCAFile', // !
  'tlsInsecure',
] as const;

const allowedAuthMechanismProperties = [
  'CANONICALIZE_HOST_NAME',
  'AWS_SESSION_TOKEN',
  'ENVIRONMENT',
  'TOKEN_RESOURCE',
] as const;

const disallowedAuthMechanismProperties = [
  'SERVICE_HOST',
  'SERVICE_NAME',
  'SERVICE_REALM',
  'ALLOWED_HOSTS',
  'OIDC_CALLBACK',
  'OIDC_HUMAN_CALLBACK',
] as const;

// Ensure that all connection string options known to the Node.js driver
// and appear either in allowed or disallowed ConnectionStringOptions list.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function checkAllowedPlusDisallowedEqualsOptionsKeys(
  input1:
    | typeof allowedConnectionStringOptions[number]
    | typeof disallowedConnectionStringOptions[number],
  input2: keyof MongoClientOptions
): [
  keyof MongoClientOptions,
  (
    | typeof allowedConnectionStringOptions[number]
    | typeof disallowedConnectionStringOptions[number]
  )
] {
  return [input1, input2];
}

type ExactAuthMechanismProperties = {
  [K in keyof AuthMechanismProperties as string extends K
    ? never
    : K]: AuthMechanismProperties[K];
};

// Ensure that all auth mechanism properties known to the Node.js driver
// and appear either in allowed or disallowed AuthMechanismProperties list.
// TODO: remove ExactAuthMechanismProperties when https://jira.mongodb.org/browse/NODE-4100 is done.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function checkAllowedPlusDisallowedEqualsAuthMechanismKeys(
  input1:
    | typeof allowedAuthMechanismProperties[number]
    | typeof disallowedAuthMechanismProperties[number],
  input2: keyof ExactAuthMechanismProperties
): [
  keyof ExactAuthMechanismProperties,
  (
    | typeof allowedAuthMechanismProperties[number]
    | typeof disallowedAuthMechanismProperties[number]
  )
] {
  return [input1, input2];
}

export function hasDisallowedConnectionStringOptions(
  connectionString: string
): boolean {
  let connectionStringUrl;
  try {
    connectionStringUrl = new ConnectionStringUrl(connectionString, {
      looseValidation: false,
    });
  } catch (error) {
    return true;
  }

  const searchParams =
    connectionStringUrl.typedSearchParams<MongoClientOptions>();
  const nonLocalhostsCount = connectionStringUrl.hosts.filter(
    (host) => !isLocalhost(host)
  ).length;

  const options: string[] = [];

  if (
    nonLocalhostsCount &&
    ((!connectionStringUrl.isSRV &&
      !(
        searchParams.get('ssl') === 'true' || searchParams.get('tls') === 'true'
      )) ||
      (connectionStringUrl.isSRV &&
        (searchParams.get('ssl') === 'false' ||
          searchParams.get('tls') === 'false')))
  ) {
    options.push('ssl/tls');
  }

  if (!options.length && [...searchParams].length) {
    for (const [name, value] of searchParams) {
      if (
        !(allowedConnectionStringOptions as readonly string[]).includes(name) ||
        (disallowedConnectionStringOptions as readonly string[]).includes(name)
      ) {
        options.push(name);
      }

      if (name === 'authMechanismProperties') {
        const authMechanismProperties =
          new CommaAndColonSeparatedRecord<AuthMechanismProperties>(value);
        for (const [authMechanismPropName] of authMechanismProperties) {
          if (
            !(allowedAuthMechanismProperties as readonly string[]).includes(
              authMechanismPropName
            ) ||
            (disallowedAuthMechanismProperties as readonly string[]).includes(
              authMechanismPropName
            )
          ) {
            options.push(`authMechanismProperties.${authMechanismPropName}`);
          }
        }
      }
    }
  }

  if (!options.length) {
    return false;
  }

  log.warn(
    mongoLogId(1_001_000_291),
    'ValidateConnectionStringUtil',
    'Connection string contains disallowed options',
    { options, connectionString: redactConnectionString(connectionString) }
  );
  return true;
}
