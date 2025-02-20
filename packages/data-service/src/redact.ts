import type { ConnectionOptions } from './connection-options';
import { redactConnectionString } from 'mongodb-connection-string-url';
export { redactConnectionString };

export function redactConnectionOptions(
  options: ConnectionOptions
): ConnectionOptions {
  const redactedTunnelOptions = options.sshTunnel
    ? {
        ...options.sshTunnel,
      }
    : undefined;

  const redacted: ConnectionOptions = {
    ...options,
    sshTunnel: redactedTunnelOptions,
  };

  redacted.connectionString = redactConnectionString(options.connectionString);

  if (redacted.sshTunnel?.password) {
    redacted.sshTunnel.password = '<redacted>';
  }

  if (redacted.sshTunnel?.identityKeyPassphrase) {
    redacted.sshTunnel.identityKeyPassphrase = '<redacted>';
  }

  return redacted;
}
