import { expect } from 'chai';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';

import databasesReducer, { INITIAL_STATE, changeDatabases } from './databases';

import { createInstance } from '../../test/helpers';

const CONNECTION_ID = 'webscale';

async function createDatabases(dbs: any[] = []) {
  const preferences = await createSandboxFromDefaultPreferences();
  const data = createInstance(dbs, undefined, preferences).databases.map(
    (db) => {
      return {
        ...db.toJSON(),
        collections: db.collections.toJSON(),
      };
    }
  );
  return data.map(({ is_non_existent, collections, ...rest }) => ({
    ...rest,
    isNonExistent: is_non_existent,
    collections: collections.map(({ is_non_existent, ...coll }) => ({
      ...coll,
      isNonExistent: is_non_existent,
    })),
  }));
}

describe('sidebar databases', function () {
  describe('#reducer', function () {
    context('when changing databases', function () {
      it('sets databases as-is', async function () {
        const dbs = await createDatabases([{ _id: 'foo' }, { _id: 'bar' }]);

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
