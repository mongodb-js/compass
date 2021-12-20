import { ConnectionOptions } from 'mongodb-data-service';

export interface ConnectionFormWarning {
  message: string;
}

export function getConnectFormWarnings(
  connectionOptions: ConnectionOptions
): ConnectionFormWarning[] {
  return [];
}
