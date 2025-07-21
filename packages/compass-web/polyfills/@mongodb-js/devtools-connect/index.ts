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
  const client = new MongoClient(url, options);
  await client.connect();
  return {
    client,
    state: {
      getStateShareServer() {
        return Promise.resolve('Not Available');
      },
      oidcPlugin: {
        logger,
        serialize() {
          return Promise.resolve(undefined);
        },
      },
      destroy() {
        return Promise.resolve();
      },
    },
  };
}
