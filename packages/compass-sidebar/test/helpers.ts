import { type PreferencesAccess } from 'compass-preferences-model';
import { MongoDBInstance } from 'mongodb-instance-model';

export function createInstance(
  dbs = [
    { _id: 'admin', collections: ['citibikecoll', 'coll'] },
    { _id: 'citibike', collections: ['admincoll', 'coll2'] },
  ],
  topologyDescription = {
    type: 'Unknown',
    servers: [],
    setName: 'foo',
  },
  preferences: PreferencesAccess
) {
  return new MongoDBInstance({
    _id: '123',
    databases: dbs.map((db) => {
      return {
        _id: db._id,
        inferred_from_privileges: false,
        collections: (db.collections || []).map((coll) => {
          return {
            _id: `${db._id}.${coll}`,
            inferred_from_privileges: false,
          };
        }),
      };
    }),
    topologyDescription,
    preferences,
  } as any);
}
