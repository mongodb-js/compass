import type { ConnectionOptions } from './connection-options';
import DataService from './data-service';

export default async function connect(
  connectionOptions: ConnectionOptions
): Promise<DataService> {
  const dataService = new DataService(connectionOptions);
  await dataService.connect();
  return dataService;
}
