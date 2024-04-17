import { promises as fs } from 'fs';
import { EJSON } from 'bson';
import type { Document } from 'bson';
import path from 'path';
import type { MongoClient } from 'mongodb';

export type Fixtures = {
  [dbName: string]: {
    [colName: string]: Document;
  };
};

export async function loadFixturesToDB({
  mongoClient,
}: {
  mongoClient: MongoClient;
}): Promise<Fixtures> {
  const fixtureFiles = (
    await fs.readdir(path.join(__dirname, 'fixtures'), 'utf-8')
  ).filter((f) => f.endsWith('.json'));

  const fixtures: Fixtures = {};

  for (const fixture of fixtureFiles) {
    const fileContent = await fs.readFile(
      path.join(__dirname, 'fixtures', fixture),
      'utf-8'
    );

    const [db, coll] = fixture.split('.');

    const ejson = EJSON.parse(fileContent);

    fixtures[db] = { [coll]: EJSON.serialize(ejson.data) };

    await mongoClient.db(db).collection(coll).insertMany(ejson.data);

    if (ejson.indexes) {
      for (const index of ejson.indexes) {
        await mongoClient.db(db).collection(coll).createIndex(index);
      }
    }
  }

  return fixtures;
}
