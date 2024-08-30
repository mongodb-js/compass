import type { ConnectionOptions } from './connection-options';
import type { DataService } from './data-service';
import type { DataServiceImplLogger } from './logger';
import { DataServiceImpl } from './data-service';
import type { DevtoolsProxyOptions } from '@mongodb-js/devtools-proxy-support';

export default async function connect({
  connectionOptions,
  proxyOptions,
  signal,
  logger,
  productName,
  productDocsLink,
}: {
  connectionOptions: ConnectionOptions;
  proxyOptions?: DevtoolsProxyOptions;
  signal?: AbortSignal;
  logger?: DataServiceImplLogger;
  productName?: string;
  productDocsLink?: string;
}): Promise<DataService> {
  const dataService = new DataServiceImpl(
    connectionOptions,
    logger,
    proxyOptions
  );
  await dataService.connect({
    signal,
    productName,
    productDocsLink,
  });
  return dataService;
}
