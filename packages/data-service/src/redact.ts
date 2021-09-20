import { SshTunnelConfig } from '@mongodb-js/ssh-tunnel';
import { ConnectionOptions } from './connection-options';

export function redactConnectionString(uri: string): string {
  const regexes = [
    // Username and password
    /(?<=\/\/)(.*)(?=@)/g,
    // AWS IAM Session Token as part of query parameter
    /(?<=AWS_SESSION_TOKEN(:|%3A))([^,&]+)/,
  ];
  regexes.forEach((r) => {
    uri = uri.replace(r, '<credentials>');
  });
  return uri;
}

export function redactConnectionOptions(
  options: ConnectionOptions
): ConnectionOptions {
  const redacted = { ...options };

  redacted.connectionString = redactConnectionString(options.connectionString);

  if (redacted.sshTunnel?.password) {
    redacted.sshTunnel.password = '<redacted>';
  }

  if (redacted.sshTunnel?.identityKeyPassphrase) {
    redacted.sshTunnel.identityKeyPassphrase = '<redacted>';
  }

  return redacted;
}

export function redactSshTunnelOptions(
  options: SshTunnelConfig
): SshTunnelConfig {
  const redacted = { ...options };

  if (redacted.password) {
    redacted.password = '<redacted>';
  }

  if (redacted.privateKey) {
    redacted.privateKey = '<redacted>';
  }

  if (redacted.passphrase) {
    redacted.passphrase = '<redacted>';
  }

  return redacted;
}
