const { TestBackend } = require('storage-mixin');
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisifyAmpersandMethod } from 'mongodb-data-service';

import { FavoriteQueryStorage } from '.';
import { FavoriteQuery, FavoriteQueryCollection } from '../models';

async function createNewQuery(data) {
  const model = new FavoriteQuery(data);
  const save = promisifyAmpersandMethod(
    model.save.bind(model)
  );
  await save(data);
  return model;
}

async function loadById(_id) {
  const favoriteCollection = new FavoriteQueryCollection();
  const fetch = promisifyAmpersandMethod(
    favoriteCollection.fetch.bind(favoriteCollection)
  );
  const models = await fetch();
  return models.find((model) => model._id === _id);
}

describe('favorite-query-storage [Utils]', function() {
  let tmpDir;
  let favoriteQueryStorage;
  beforeEach(function() {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'connection-storage-tests'));
    TestBackend.enable(tmpDir);
    favoriteQueryStorage = new FavoriteQueryStorage();
  });

  afterEach(function() {
    TestBackend.disable();
    fs.rmdirSync(tmpDir, { recursive: true });
  });

  it('loads all queries', async function() {
    expect(await favoriteQueryStorage.loadAll()).to.be.empty;

    const data = [
      {
        _id: '279a2112-184e-4403-bbd1-e6742196c397',
        _name: 'hello - 1',
        _ns: 'query.storage'
      },
      {
        _id: '279a2112-284e-4403-bbd1-e6742196c397',
        _name: 'hello - 2',
        _ns: 'query.storage'
      }
    ];
    await createNewQuery(data[0]);
    await createNewQuery(data[1]);

    const queries = await favoriteQueryStorage.loadAll();
    expect(queries.find(x => x._id === data[0]._id)).to.deep.equal(data[0]);
    expect(queries.find(x => x._id === data[1]._id)).to.deep.equal(data[1]);

    expect(queries).to.have.length(2);
  });

  it('updates a query', async function() {
    const data = {
      _id: '279a2112-384e-4403-bbd1-e6742196c397',
      _name: 'hello',
      _ns: 'query.storage'
    };
    await createNewQuery(data);
    const updatedQuery = await favoriteQueryStorage.updateAttributes(data._id, {_name: 'updated name'});
    const query = await loadById(data._id);
    const attrs = query.getAttributes({ props: true });
    delete attrs._dateModified;
    expect(attrs, 'updates in storage').to.deep.equal({
      ...data,
      _name: 'updated name',
    });

    delete updatedQuery._dateModified;
    expect(updatedQuery, 'returns updated query').to.deep.equal({
      ...data,
      _name: 'updated name',
    });
  });

  it('deletes a query', async function() {
    const data = {
      _id: '279a2112-284e-4403-bbd1-e6742196c397',
      _name: 'hello',
      _ns: 'query.storage'
    };
    await createNewQuery(data);
    expect(await loadById(data._id)).to.not.be.undefined;

    await favoriteQueryStorage.delete(data._id);
    expect(await loadById(data._id)).to.be.undefined;
  });
});

