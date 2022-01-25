import { expect } from 'chai';
import { cleanUp } from '../test/setup';

import { FavoriteQueryCollection } from '@mongodb-js/compass-query-history';
import { getQueries } from './queries';

const mockQueries = [
  {
    _id: '1234',
    _name: 'find all by id',
    _ns: 'mongodb.compass',
    _dateSaved: 123456789,
  },
  {
    _id: '5678',
    _name: 'find all by name',
    _ns: 'mongodb.mongosh',
    _dateSaved: 987654321,
  }
];

describe('Queries', function () {

  before(async function () {
    const collection = new FavoriteQueryCollection(mockQueries);
    const promises = collection.models.map(model => {
      return new Promise((resolve, reject) => {
        model.sync('create', model, {
          success: resolve,
          error: reject,
        });
      });
    });
    await Promise.all(promises);
  });

  after(function () {
    cleanUp();
  });

  it('fetches all the saved queries', async function () {
    const response = await getQueries();
    response.sort((a, b) => a._dateSaved - b._dateSaved);

    const queries = [...mockQueries];
    queries.sort((a, b) => a._dateSaved - b._dateSaved);

    expect(response).to.deep.equal(queries);
  });
});
