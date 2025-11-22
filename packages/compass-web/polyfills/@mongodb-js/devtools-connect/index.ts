import * as devtools_connect from 'devtools-connect-original';
import { createMongoDBOIDCPlugin } from '../oidc-plugin';

export function hookLogger() {
  /* no-op */
}

export async function connectMongoClient(
  url: string,
  options: any,
  logger: any,
  MongoClient: any
): Promise<any> {
  // Remove options not understood by the plain Node.js driver
  delete options.proxy;
  delete options.applyProxyToOIDC;
  delete options.productDocsLink;
  delete options.productName;
  delete options.oidc;
  delete options.parentState;
  delete options.parentHandle;
  options.__skipPingOnConnect = true;
  const { client } = await devtools_connect.connectMongoClient(
    url,
    options,
    logger,
    MongoClient
  );
  return {
    client,
    state: {
      // eslint-disable-next-line @typescript-eslint/require-await
      async getStateShareServer() {
        return 'Not Available';
      },
      oidcPlugin: createMongoDBOIDCPlugin({ logger }),
      async destroy() {},
    },
  };
}
