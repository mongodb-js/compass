import { defaultHostname, defaultPort } from '../constants/default-connection';

function hostHasPortNumber(host: string): boolean {
  return (
    host.includes(':') && !isNaN(Number(host.slice(host.indexOf(':') + 1)))
  );
}

function getPortFromHostOrDefault(host: string): number {
  if (hostHasPortNumber(host)) {
    // Incase the number is NaN this will return 27017.
    return Number(host.slice(host.indexOf(':') + 1)) || 27017;
  }
  return defaultPort;
}

export function getNextHost(hosts: string[], addAfterIndex: number): string {
  if (hosts.length < 1) {
    // Use the default host if we have no reference.
    return `${defaultHostname}:${defaultPort}`;
  }

  const hostToAddAfter = hosts[addAfterIndex];
  const hostname = hostToAddAfter.includes(':')
    ? hostToAddAfter.slice(0, hostToAddAfter.indexOf(':'))
    : hostToAddAfter;

  const port = getPortFromHostOrDefault(hostToAddAfter) + 1;

  // Return the last hosts' hostname and port + 1.
  return `${hostname || defaultHostname}:${port}`;
}
