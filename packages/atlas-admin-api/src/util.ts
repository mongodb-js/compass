import ConnectionString from 'mongodb-connection-string-url';
import type { AtlasClusterConnectionStrings } from './cluster-types';

export function extractConnectionStrings(
  connectionStrings?: AtlasClusterConnectionStrings
): string[] {
  return [
    ...(connectionStrings?.standardSrv ? [connectionStrings.standardSrv] : []),
    ...(connectionStrings?.standard ? [connectionStrings.standard] : []),
  ];
}

export function connectionStringMatches(
  input: ConnectionString,
  candidate: string
): boolean {
  let candidateUrl: ConnectionString;
  try {
    candidateUrl = new ConnectionString(candidate);
  } catch {
    return false;
  }
  if (input.isSRV !== candidateUrl.isSRV) {
    return false;
  }
  const inputFirstHost = input.hosts[0]?.toLowerCase();
  const candidateFirstHost = candidateUrl.hosts[0]?.toLowerCase();
  return inputFirstHost !== undefined && inputFirstHost === candidateFirstHost;
}
