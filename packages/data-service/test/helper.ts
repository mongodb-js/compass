import chai from 'chai';
import { DeleteResult, InsertManyResult } from 'mongodb';
import sinonChai from 'sinon-chai';
import { NativeClient } from '../src/native-client';
import { Callback } from '../src/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Connection = require('mongodb-connection-model');

chai.use(sinonChai);

export const connection = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'data-service',
});

export function insertTestDocuments(
  client: NativeClient,
  callback: Callback<InsertManyResult<Document>>
): void {
  const collection = client.database.collection('test');
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
    (err, result) => callback(err, result!)
  );
}

export function deleteTestDocuments(
  client: NativeClient,
  callback: Callback<DeleteResult>
): void {
  const collection = client.database.collection('test');
  void collection.deleteMany((err: any, result: any) => callback(err, result));
}
