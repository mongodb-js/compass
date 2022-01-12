import { ConnectionOptions } from 'mongodb-data-service';

export interface ConnectionFormWarning {
  message: string;
}

export function getConnectFormWarnings(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connectionOptions: ConnectionOptions
): ConnectionFormWarning[] {
  return [];
}
