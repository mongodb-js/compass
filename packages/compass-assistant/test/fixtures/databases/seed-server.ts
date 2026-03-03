import type { MongoClient } from 'mongodb';
import type { SeedDatabase } from '../../types/seed-data';

const INDEX_POLL_INTERVAL_MS = 100;

/**
 * Waits until no index builds are in progress on the server.
 * Uses the currentOp command to check for active index build operations.
 */
async function waitForIndexBuilds(client: MongoClient): Promise<void> {
  const admin = client.db('admin');

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await admin.command({
      currentOp: true,
      $all: false,
      'command.createIndexes': { $exists: true },
    });

    const activeBuilds = (result.inprog ?? []).length;
    if (activeBuilds === 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, INDEX_POLL_INTERVAL_MS));
  }
}

/**
 * Seeds a MongoDB server with the given SeedDatabase definitions.
 *
 * For each database: creates every collection, inserts its documents,
 * and creates any specified indexes. Waits for all index builds to
 * complete before returning.
 *
 * The caller owns the MongoClient lifecycle (connect/close).
 */
export async function seedServer(
  client: MongoClient,
  databases: SeedDatabase[]
): Promise<void> {
  for (const database of databases) {
    const db = client.db(database.databaseName);

    for (const collection of database.collections) {
      const coll = db.collection(collection.collectionName);

      if (collection.documents.length > 0) {
        await coll.insertMany(collection.documents);
      }

      if (collection.indexes) {
        for (const index of collection.indexes) {
          await coll.createIndex(index.key, index.options ?? {});
        }
      }
    }
  }

  await waitForIndexBuilds(client);
}
