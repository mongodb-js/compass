import { ConnectionSshOptions } from './connection-options';

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

export function redactSshTunnelOptions(
  options: ConnectionSshOptions
): ConnectionSshOptions {
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
