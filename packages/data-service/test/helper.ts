import chai from 'chai';
import { DeleteResult, InsertManyResult } from 'mongodb';
import sinonChai from 'sinon-chai';
import DataService from '../src/data-service';
import { LegacyConnectionModel } from '../src/legacy-connection-model';
import { Callback } from '../src/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Connection = require('mongodb-connection-model');

chai.use(sinonChai);

export const connection: LegacyConnectionModel = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'data-service',
});

export function insertTestDocuments(
  service: DataService,
  callback: Callback<InsertManyResult<Document>>
): void {
  const collection = (service as any).db.collection('test');
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
    callback
  );
}

export function deleteTestDocuments(
  service: DataService,
  callback: Callback<DeleteResult>
): void {
  const collection = (service as any).db.collection('test');
  void collection.deleteMany(callback);
}
