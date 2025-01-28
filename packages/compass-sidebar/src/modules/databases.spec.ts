import { expect } from 'chai';

import databasesReducer, { INITIAL_STATE, changeDatabases } from './databases';

import { createInstance } from '../../test/helpers';

const CONNECTION_ID = 'webscale';

function createDatabases(dbs: any[] = []) {
  const data = createInstance(dbs).databases.map((db) => {
    return {
      ...db.toJSON(),
      collections: db.collections.toJSON(),
    };
  });
  return data.map(({ is_non_existant, collections, ...rest }) => ({
    ...rest,
    isNonExistant: is_non_existant,
    collections: collections.map(({ is_non_existant, ...coll }) => ({
      ...coll,
      isNonExistant: is_non_existant,
    })),
  }));
}

describe('sidebar databases', function () {
  describe('#reducer', function () {
    context('when changing databases', function () {
      it('sets databases as-is', function () {
        const dbs = createDatabases([{ _id: 'foo' }, { _id: 'bar' }]);

        expect(
          databasesReducer(undefined, changeDatabases(CONNECTION_ID, dbs))
        ).to.deep.equal({
          [CONNECTION_ID]: {
            ...INITIAL_STATE,
            databases: dbs,
          },
        });
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(databasesReducer(undefined, {} as any)).to.equal(INITIAL_STATE);
      });
    });
  });
});
