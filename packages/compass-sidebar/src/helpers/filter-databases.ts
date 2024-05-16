import type {
  Database,
  Collection,
} from '@mongodb-js/compass-connections-navigation/dist/connections-navigation-tree';

export const filterDatabases = (
  databases: Database[],
  re: RegExp
): Database[] => {
  const result: Database[] = [];
  for (const db of databases) {
    const id = db._id;
    if (re.test(id)) {
      result.push(db);
    } else {
      const collections = db.collections.filter(({ name }: Collection) =>
        re.test(name)
      );

      if (collections.length > 0) {
        result.push({
          ...db,
          collections,
        });
      }
    }
  }

  return result;
};
