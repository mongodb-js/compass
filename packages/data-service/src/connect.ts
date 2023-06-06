import type { ConnectionOptions } from './connection-options';
import type { DataService } from './data-service';
import type { DataServiceImplLogger } from './logger';
import { DataServiceImpl } from './data-service';

export default async function connect({
  connectionOptions,
  signal,
  logger,
  productName,
  productDocsLink,
}: {
  connectionOptions: ConnectionOptions;
  signal?: AbortSignal;
  logger?: DataServiceImplLogger;
  productName?: string;
  productDocsLink?: string;
}): Promise<DataService> {
  const dataService = new DataServiceImpl(connectionOptions, logger);
  await dataService.connect({
    signal,
    productName,
    productDocsLink,
  });
  return dataService;
}
