import { makeModel } from '../electron/renderer/stores/instance-store';

export function createInstance(databases = [
  { _id: 'admin', collections: ['citibikecoll', 'coll'] },
  { _id: 'citibike', collections: ['admincoll', 'coll2'] },
]) {
  const dbModels = databases.map((d) => makeModel(d));

  dbModels.toJSON = function toJSON() {
    return Array.from(this).map((db) => db.toJSON());
  };
  return {
    _id: '123',
    databases: dbModels,
    genuineMongoDB: {
      isGenuine: true,
      on() {},
      off() {},
      toJSON() {
        return { isGenuine: this.isGenuine };
      }
    },
    dataLake: {
      isDataLake: false,
      on() {},
      off() {},
      toJSON() {
        return { isDataLake: this.isDataLake };
      }
    },
    on() {},
    off() {},
    toJSON() {
      return {
        _id: this._id,
        databases: this.databases.toJSON(),
        genuineMongoDB: this.genuineMongoDB.toJSON(),
        dataLake: this.dataLake.toJSON(),
      };
    },
  };
}
