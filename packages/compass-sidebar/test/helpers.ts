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
        is_ghost_namespace: false,
        collections: (db.collections || []).map((coll) => {
          return {
            _id: `${db._id}.${coll}`,
            is_ghost_namespace: false,
          };
        }),
      };
    }),
    topologyDescription,
    preferences,
  } as any);
}
