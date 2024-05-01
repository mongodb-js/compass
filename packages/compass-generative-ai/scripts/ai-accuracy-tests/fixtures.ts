import { promises as fs } from 'fs';
import { EJSON } from 'bson';
import type { Document } from 'bson';
import path from 'path';
import type { MongoClient } from 'mongodb';

export type Fixtures = {
  [dbName: string]: {
    [colName: string]: Document /* Extended JSON javascript object. */;
  };
};

function getDynamicDateFixture(): {
  db: string;
  coll: string;
  documents: Document[];
} {
  return {
    db: 'UFO',
    coll: 'sightings',
    documents: [
      {
        description: 'Flying Saucer in the sky, numerous reports.',
        where: 'Oklahoma',
        // Last year.
        year: `${new Date().getFullYear() - 1}`,
      },
      {
        description: 'Alien spaceship.',
        where: 'Tennessee',
        year: `2005`,
      },
      {
        description:
          'Portal in the sky created by moving object, possibly just northern lights.',
        where: 'Alaska',
        year: `2020`,
      },
      {
        description: 'Floating pineapple, likely northern lights.',
        where: 'Alaska',
        year: `2021`,
      },
      {
        description:
          'Someone flying on a broomstick, sighters reported "It looks like Harry Potter".',
        where: 'New York',
        year: `2022`,
      },
    ],
  };
}

const dynamicFixtures: {
  db: string;
  coll: string;
  documents: Document[];
}[] = [getDynamicDateFixture()];

export async function loadFixturesToDB({
  mongoClient,
}: {
  mongoClient: MongoClient;
}): Promise<Fixtures> {
  const fixtureFiles = (
    await fs.readdir(path.join(__dirname, 'fixtures'), 'utf-8')
  ).filter((f) => f.endsWith('.json'));

  const fixtures: Fixtures = {};

  // Load the static json fixtures.
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

  // Load dynamic fixtures.
  for (const { db, coll, documents } of dynamicFixtures) {
    fixtures[db] = { [coll]: documents };
    await mongoClient.db(db).collection(coll).insertMany(documents);
  }

  return fixtures;
}
