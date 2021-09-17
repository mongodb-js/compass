import { ConnectionOptions } from '@mongodb-js/devtools-docker-test-envs/src/test-environment-configuration';
import chai from 'chai';
import { MongoClient } from 'mongodb';
import sinonChai from 'sinon-chai';
import util from 'util';

import {
  LegacyConnectionModel,
  LegacyConnectionModelProperties,
} from '../lib/legacy-connection-model';
import { convertConnectionModelToOptions } from '../src/legacy/legacy-connection-model';
import { Callback } from '../src/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Connection = require('mongodb-connection-model');

chai.use(sinonChai);

export const connection: LegacyConnectionModel = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'data-service',
});
export const connectionOptions = convertConnectionModelToOptions(connection);

export function createConnectionModel(
  opts: Partial<LegacyConnectionModelProperties>
) {
  return new Connection(opts);
}

export function insertTestDocuments(
  client: MongoClient,
  callback: Callback<void>
): void {
  const collection = client.db().collection('test');
  void collection.insertMany(
    [
      {
        1: 'a',
        a: 1,
      },
      {
        2: 'a',
        a: 2,
      },
    ],
    callback as any
  );
}

export function deleteTestDocuments(
  client: MongoClient,
  callback: Callback<void>
): void {
  const collection = client.db().collection('test');
  void collection.deleteMany(callback);
}
