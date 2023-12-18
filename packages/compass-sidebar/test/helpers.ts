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
  }
) {
  return new MongoDBInstance({
    _id: '123',
    databases: dbs.map((db) => {
      return {
        _id: db._id,
        collections: (db.collections || []).map((coll) => {
          return {
            _id: `${db._id}.${coll}`,
          };
        }),
      };
    }),
    topologyDescription,
  } as any);
}
