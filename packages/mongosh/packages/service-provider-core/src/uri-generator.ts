/* eslint complexity: 0*/

import { CommonErrors, MongoshInvalidInputError } from '@mongosh/errors';
import i18n from '@mongosh/i18n';
import CliOptions from './cli-options';
import { ConnectionString } from './connection-string';
import { DEFAULT_DB } from './index';

/**
 * URI schemes.
 */
enum Scheme {
  Mongo = 'mongodb://',
  MongoSrv = 'mongodb+srv://'
}

/**
 * The default host.
 */
const DEFAULT_HOST = '127.0.0.1';

/**
 * The default port.
 */
const DEFAULT_PORT = '27017';

/**
 * GSSAPI options not supported as options in Node driver,
 * only in the URI.
 */
// const GSSAPI_HOST_NAME = 'gssapiHostName';

/**
 * GSSAPI options not supported as options in Node driver,
 * only in the URI.
 */
// const GSSAPI_SERVICE_NAME = 'gssapiServiceName';

/**
 * Conflicting host/port message.
 */
const CONFLICT = 'cli-repl.uri-generator.no-host-port';

/**
 * Invalid host message.
 */
const INVALID_HOST = 'cli-repl.uri-generator.invalid-host';

/**
 * Validate conflicts in the options.
 *
 * @param {CliOptions} options - The options.
 */
function validateConflicts(options: CliOptions): void {
  if (options.host || options.port) {
    throw new MongoshInvalidInputError(i18n.__(CONFLICT), CommonErrors.InvalidArgument);
  }
}

/**
 * Perform basic validation of the --host option.
 *
 * @param {string} host - The value of the --host option.
 */
function validateHost(host: string): void {
  const invalidCharacter = host.match(/[^a-zA-Z0-9.:\[\]-]/);
  if (invalidCharacter) {
    throw new MongoshInvalidInputError(
      i18n.__(INVALID_HOST) + ': ' + invalidCharacter[0],
      CommonErrors.InvalidArgument);
  }
}

/**
 * Generate the host from the options or default.
 *
 * @param {CliOptions} options - The options.
 *
 * @returns {string} The host.
 */
function generateHost(options: CliOptions): string {
  if (options.host) {
    validateHost(options.host);
    if (options.host.includes(':')) {
      return options.host.split(':')[0];
    }
    return options.host;
  }
  return DEFAULT_HOST;
}

/**
 * Generate the port from the options or default.
 *
 * @param {CliOptions} options - The options.
 *
 * @returns {string} The port.
 */
function generatePort(options: CliOptions): string {
  if (options.host && options.host.includes(':')) {
    validateHost(options.host);
    const port = options.host.split(':')[1];
    if (!options.port || options.port === port) {
      return port;
    }
    throw new MongoshInvalidInputError(i18n.__(CONFLICT), CommonErrors.InvalidArgument);
  }
  return options.port ? options.port : DEFAULT_PORT;
}

/**
 * Generate a URI from the provided CLI options.
 *
 * If a full URI is provided, you cannot also specify --host or --port
 *
 * Rules from the existing Shell code:
 *
 * if nodb is set then all positional parameters are files
 * otherwise the first positional parameter might be a dbaddress, but
 * only if one of these conditions is met:
 *   - it contains no '.' after the last appearance of '\' or '/'
 *   - it doesn't end in '.js' and it doesn't specify a path to an existing file
 *
 * gssapiHostName?: string; // needs to go in URI
 * gssapiServiceName?: string; // needs to go in URI
 */
function generateUri(options: CliOptions): string {
  if (options.nodb) {
    return '';
  }
  const connectionString = generateUriNormalized(options);
  if (connectionString.hosts.length === 1 &&
      ['localhost', '127.0.0.1'].includes(connectionString.hosts[0].split(':')[0])) {
    const params = connectionString.searchParams;
    if (!params.has('serverSelectionTimeoutMS')) {
      params.set('serverSelectionTimeoutMS', '2000');
    }
  }
  return connectionString.toString();
}
function generateUriNormalized(options: CliOptions): ConnectionString {
  const uri = options._?.[0];

  // There is no URI provided, use default 127.0.0.1:27017
  if (!uri) {
    return new ConnectionString(`${Scheme.Mongo}${generateHost(options)}:${generatePort(options)}/?directConnection=true`);
  }

  // mongodb+srv:// URI is provided, treat as correct and immediately return
  if (uri.startsWith(Scheme.MongoSrv)) {
    validateConflicts(options);
    return new ConnectionString(uri);
  } else if (uri.startsWith(Scheme.Mongo)) {
    // we need to figure out if we have to add the directConnection query parameter
    validateConflicts(options);
    return addShellConnectionStringParameters(new ConnectionString(uri));
  }

  // Capture host, port and db from the string and generate a URI from
  // the parts.
  const uriMatch = /^([A-Za-z0-9][A-Za-z0-9.-]+):?(\d+)?[\/]?(\S+)?$/gi;
  const parts = uriMatch.exec(uri);

  if (parts === null) {
    throw new MongoshInvalidInputError(`Invalid URI: ${uri}`, CommonErrors.InvalidArgument);
  }

  let host: string | undefined = parts[1];
  const port = parts[2];
  let dbAndQueryString = parts[3];

  // If there is no port and db, host becomes db if there is no
  // '.' in the string. (legacy shell behaviour)
  if (!port && !dbAndQueryString && host.indexOf('.') < 0) {
    dbAndQueryString = host;
    host = undefined;
  }

  // If we have a host or port, validate that the options don't also
  // have a host or port in them.
  if (host || port) {
    validateConflicts(options);
  }

  return addShellConnectionStringParameters(new ConnectionString(
    `${Scheme.Mongo}${host || generateHost(options)}:${port || generatePort(options)}/${dbAndQueryString ?? DEFAULT_DB}`));
}

/**
 * Adds the `directConnection=true` query parameter if required, and copy
 * tlsCertificateKeyFile to tlsCertificateFile if the former is set but
 * the latter is not.
 * @param uri mongodb:// connection string
 */
function addShellConnectionStringParameters(uri: ConnectionString): ConnectionString {
  uri = uri.clone();
  const params = uri.searchParams;
  if (!params.has('replicaSet') && !params.has('directConnection') && uri.hosts.length === 1) {
    params.set('directConnection', 'true');
  }
  if (!params.has('tlsCertificateFile') && params.has('tlsCertificateKeyFile')) {
    params.set('tlsCertificateFile', params.get('tlsCertificateKeyFile') as string);
  }
  return uri;
}

export default generateUri;
export { Scheme };
