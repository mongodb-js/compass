import type { TranslateFn } from '@mongodb-js/compass-components';

const STATIC_MESSAGES: Record<string, string> = {
  'connections.form.validation.readPreferenceOptionsMode':
    'Read preference tags and max staleness can only be used with a read preference other than primary.',
  'connections.form.validation.tagSetFormat':
    'Tag sets must be in the format key0:value0,key1:value1.',
  'connections.form.validation.maxStaleness':
    'Max staleness must be at least 90 seconds.',
  'connections.form.validation.usernameMissing': 'Username is missing.',
  'connections.form.validation.passwordMissing': 'Password is missing.',
  'connections.form.validation.x509Tls':
    'TLS must be enabled in order to use x509 authentication.',
  'connections.form.validation.x509Certificate':
    'A Client Certificate is required with x509 authentication.',
  'connections.form.validation.kerberosPrincipal':
    'Principal name is required with Kerberos.',
  'connections.form.validation.sshHostname':
    'A hostname is required to connect with an SSH tunnel.',
  'connections.form.validation.sshCredentials':
    'When connecting via SSH tunnel either password or identity file is required.',
  'connections.form.validation.sshPassphraseFile':
    'File is required along with passphrase.',
  'connections.form.validation.proxyHostname': 'Proxy hostname is required.',
  'connections.form.validation.keyVaultFormat':
    'Key Vault namespace must be of the format <db>.<collection>',
  'connections.form.validation.keyVaultRequired':
    'Key Vault namespace must be specified for In-Use-Encryption-enabled connections',
  'connections.form.validation.localKey':
    'Local key must be a Base64-encoded 96-byte string',
  'connections.form.validation.kmipEndpoint':
    'KMIP endpoint must be of the format <host>:<port>',
  'connections.form.validation.csfleStoredToDisk':
    'In-Use Encryption KMS provider credentials will be stored to disk.',
  'connections.form.validation.certificateValidationDisabled':
    'TLS/SSL certificate validation is disabled. If possible, enable certificate validation to avoid security vulnerabilities.',
  'connections.form.validation.directConnectionSrv':
    'directConnection not supported with SRV URI.',
  'connections.form.validation.directConnectionReplicaSet':
    'directConnection is not supported with replicaSet.',
  'connections.form.validation.directConnectionMultipleHosts':
    'directConnection is not supported with multiple hosts.',
  'connections.form.validation.tlsDisabled':
    'TLS/SSL is disabled. If possible, enable TLS/SSL to avoid security vulnerabilities.',
  'connections.form.validation.socksPlaintext':
    'Socks5 proxy password will be transmitted in plaintext.',
  'connections.form.validation.remoteProxyLocalHost':
    'Using remote proxy with local MongoDB service host.',
};

const INVALID_FIELD_INPUT = 'Field contained invalid input';

const STATIC_KEYS_BY_MESSAGE = new Map(
  Object.entries(STATIC_MESSAGES).map(([key, english]) => [english, key])
);

const DYNAMIC_MESSAGES: {
  pattern: RegExp;
  key: string;
  english: string;
  variable: string;
}[] = [
  {
    pattern: /^EncryptedFieldConfig is invalid: ([\s\S]*)$/,
    key: 'connections.form.validation.encryptedFieldConfig',
    english: 'EncryptedFieldConfig is invalid: {error}',
    variable: 'error',
  },
  {
    pattern: /^Unknown read preference ([\s\S]*)$/,
    key: 'connections.form.validation.unknownReadPreference',
    english: 'Unknown read preference {readPreference}',
    variable: 'readPreference',
  },
  {
    pattern: /^Invalid character in host: '([\s\S]*)'$/,
    key: 'connections.form.validation.invalidHostCharacter',
    english: "Invalid character in host: '{character}'",
    variable: 'character',
  },
  {
    pattern: /^Error updating connection schema: ([\s\S]*)$/,
    key: 'connections.form.validation.schemaUpdate',
    english: 'Error updating connection schema: {message}',
    variable: 'message',
  },
];

/**
 * Validation runs outside of React and produces English messages, so they are
 * mapped to translations right before they are handed to the UI.
 */
export function translateValidationMessage(
  t: TranslateFn,
  message: string
): string {
  const staticKey = STATIC_KEYS_BY_MESSAGE.get(message);
  if (staticKey) {
    return t(staticKey, message);
  }
  for (const { pattern, key, english, variable } of DYNAMIC_MESSAGES) {
    const match = pattern.exec(message);
    if (match) {
      const value =
        match[1] === INVALID_FIELD_INPUT
          ? t('connections.form.validation.invalidFieldInput', match[1])
          : match[1];
      return t(key, english, { [variable]: value });
    }
  }
  return message;
}
