import type { ConnectionOptions } from './connection-options';
import type { DataService } from './data-service';
import type { DataServiceImplLogger } from './logger';
import { DataServiceRenderer } from './data-service-renderer';
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
  const dataService = new DataServiceRenderer(
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
