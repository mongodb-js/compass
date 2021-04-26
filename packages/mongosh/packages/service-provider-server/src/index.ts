import CliServiceProvider from './cli-service-provider';
import CompassServiceProvider from './compass/compass-service-provider';
import { DEFAULT_DB, CliOptions, generateUri, MongoClientOptions } from '@mongosh/service-provider-core';
export {
  CliServiceProvider,
  CompassServiceProvider,
  DEFAULT_DB,
  CliOptions,
  generateUri,
  MongoClientOptions,
  MongoClientOptions as NodeOptions // TODO: Update VSCode to use MongoClientOptions
};
