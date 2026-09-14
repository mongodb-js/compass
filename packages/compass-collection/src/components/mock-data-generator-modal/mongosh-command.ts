import type { ConnectionInfo } from '@mongodb-js/connection-info';
import ConnectionString, {
  redactConnectionString,
} from 'mongodb-connection-string-url';
import { DEFAULT_CONNECTION_STRING_FALLBACK } from './constants';

export function getMongoshCommand(connectionInfo: ConnectionInfo) {
  const isAtlas = !!connectionInfo.atlasMetadata;
  const uri =
    connectionInfo.atlasMetadata?.userConnectionString ||
    connectionInfo.connectionOptions.connectionString ||
    DEFAULT_CONNECTION_STRING_FALLBACK;
  let connectionString = DEFAULT_CONNECTION_STRING_FALLBACK;
  let needsUsername = isAtlas;
  let promptsForPassword = isAtlas;

  try {
    const parsed = new ConnectionString(uri);
    const mechanism = (
      parsed.searchParams.get('authMechanism') ?? 'DEFAULT'
    ).toUpperCase();
    const passwordAuthentication = [
      'DEFAULT',
      'SCRAM-SHA-1',
      'SCRAM-SHA-256',
      'PLAIN',
    ].includes(mechanism);
    needsUsername =
      isAtlas ||
      !!parsed.username ||
      !!parsed.password ||
      (passwordAuthentication && mechanism !== 'DEFAULT');
    promptsForPassword =
      needsUsername &&
      (passwordAuthentication ||
        (mechanism === 'MONGODB-AWS' && !!parsed.password));
    parsed.username = '';
    parsed.password = '';
    connectionString = redactConnectionString(parsed.toString());
  } catch {
    // An unavailable or invalid URI must not leak unparsed credentials into the command.
  }

  // URI-encode quote characters so a single-quoted argument works in both
  // Bash/zsh and PowerShell (which also recognizes typographic quotes).
  const quotedUri = `'${connectionString.replace(
    /['\u2018\u2019\u201a\u201b]/g,
    (character) => (character === "'" ? '%27' : encodeURIComponent(character))
  )}'`;
  const command = [
    'mongosh',
    quotedUri,
    ...(needsUsername ? ['--username', "'<your-username>'"] : []),
    '--file',
    'mockdatascript.js',
    // mongosh requires a valueless --password to be last to prompt interactively.
    ...(promptsForPassword ? ['--password'] : []),
  ].join(' ');

  return { command, needsUsername, promptsForPassword };
}
