import chai from 'chai';
import { MongoClient } from 'mongodb';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

export async function insertTestDocuments(client: MongoClient): Promise<void> {
  const collection = client.db().collection('test');
  await collection.insertMany([
    {
      1: 'a',
      a: 1,
    },
    {
      2: 'a',
      a: 2,
    },
  ]);
}

export async function deleteTestDocuments(client: MongoClient): Promise<void> {
  const collection = client.db().collection('test');
  await collection.drop();
}
