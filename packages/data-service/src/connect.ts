import type { ConnectionOptions } from './connection-options';
import type { DataService } from './data-service';
import { DataServiceImpl } from './data-service';

export default async function connect(
  connectionOptions: ConnectionOptions
): Promise<DataService> {
  const dataService = new DataServiceImpl(connectionOptions);
  await dataService.connect();
  return dataService;
}
