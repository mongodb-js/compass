export function hookLoggerToMongoLogWriter() {}
export function createMongoDBOIDCPlugin({ logger }: any) {
  return {
    mongoClientOptions: {},
    logger,
    /* eslint-disable @typescript-eslint/require-await */
    serialize: async () => '',
    destroy: () => {},
  };
}
