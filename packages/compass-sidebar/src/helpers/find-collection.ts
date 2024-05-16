import type { Database } from '@mongodb-js/compass-connections-navigation/dist/connections-navigation-tree';
import toNS from 'mongodb-ns';

export function findCollection(ns: string, databases: Database[]) {
  const { database, collection } = toNS(ns);

  return (
    databases
      .find((db) => db._id === database)
      ?.collections.find((coll) => coll.name === collection) ?? null
  );
}
