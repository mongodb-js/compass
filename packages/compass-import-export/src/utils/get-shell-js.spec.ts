import { ObjectId } from 'bson';
import { expect } from 'chai';

import {
  getQueryAsShellJSString,
  newGetQueryAsShellJSString,
} from './get-shell-js';

describe('#getQueryAsShellJSString', function () {
  it('should support simple query', function () {
    const ret = getQueryAsShellJSString('lucas.pets', {
      filter: { name: 'Arlo' },
    });
    const expected = `db.pets.find(
  {name: 'Arlo'}
)`;
    expect(ret).to.equal(expected);
  });

  it('should support simple ObjectId', function () {
    const ret = getQueryAsShellJSString('lucas.pets', {
      filter: { _id: new ObjectId('deadbeefdeadbeefdeadbeef') },
    });
    const expected = `db.pets.find(
  {_id: ObjectId('deadbeefdeadbeefdeadbeef')}
)`;
    expect(ret).to.equal(expected);
  });

  it('should support a projection', function () {
    const ret = getQueryAsShellJSString('lucas.pets', {
      filter: { name: 'Arlo' },
      project: { name: 1 },
    });
    const expected = `db.pets.find(
  {name: 'Arlo'},
  {name: 1}
)`;
    expect(ret).to.equal(expected);
  });

  it('should support a skip', function () {
    const ret = getQueryAsShellJSString('lucas.pets', {
      filter: { name: 'Arlo' },
      project: { name: 1 },
      limit: 100,
    });
    const expected = `db.pets.find(
  {name: 'Arlo'},
  {name: 1}
).limit(100)`;

    expect(ret).to.equal(expected);
  });

  it('should support a limit', function () {
    const ret = getQueryAsShellJSString('lucas.pets', {
      filter: { name: 'Arlo' },
      project: { name: 1 },
      limit: 100,
      skip: 1,
    });
    const expected = `db.pets.find(
  {name: 'Arlo'},
  {name: 1}
).limit(100).skip(1)`;

    expect(ret).to.equal(expected);
  });
});

// eslint-disable-next-line mocha/max-top-level-suites
describe('#newGetQueryAsShellJSString', function () {
  it('should support simple query', function () {
    const ret = newGetQueryAsShellJSString({
      ns: 'lucas.pets',
      query: {
        filter: { name: 'Arlo' },
      },
    });
    const expected = `db.getCollection("pets").find(
  {name: 'Arlo'}
)`;
    expect(ret).to.equal(expected);
  });

  it('should support simple ObjectId', function () {
    const ret = newGetQueryAsShellJSString({
      ns: 'lucas.pets',
      query: {
        filter: { _id: new ObjectId('deadbeefdeadbeefdeadbeef') },
      },
    });
    const expected = `db.getCollection("pets").find(
  {_id: ObjectId('deadbeefdeadbeefdeadbeef')}
)`;
    expect(ret).to.equal(expected);
  });

  it('should support a projection', function () {
    const ret = newGetQueryAsShellJSString({
      ns: 'lucas.pets',
      query: {
        filter: { name: 'Arlo' },
        projection: { name: 1 },
      },
    });
    const expected = `db.getCollection("pets").find(
  {name: 'Arlo'},
  {name: 1}
)`;
    expect(ret).to.equal(expected);
  });

  it('should support a skip', function () {
    const ret = newGetQueryAsShellJSString({
      ns: 'lucas.pets',
      query: {
        filter: { name: 'Arlo' },
        projection: { name: 1 },
        limit: 100,
      },
    });
    const expected = `db.getCollection("pets").find(
  {name: 'Arlo'},
  {name: 1}
).limit(100)`;

    expect(ret).to.equal(expected);
  });

  it('should support a limit', function () {
    const ret = newGetQueryAsShellJSString({
      ns: 'lucas.pets',
      query: {
        filter: { name: 'Arlo' },
        projection: { name: 1 },
        limit: 100,
        skip: 1,
      },
    });
    const expected = `db.getCollection("pets").find(
  {name: 'Arlo'},
  {name: 1}
).limit(100).skip(1)`;

    expect(ret).to.equal(expected);
  });

  it('should support collation', function () {
    const ret = newGetQueryAsShellJSString({
      ns: 'lucas.pets',
      query: {
        filter: { name: 'Arlo' },
        collation: { locale: 'simple' },
        projection: { name: 1 },
        limit: 100,
        skip: 1,
      },
    });
    const expected = `db.getCollection("pets").collate(
  {locale: 'simple'}
).find(
  {name: 'Arlo'},
  {name: 1}
).limit(100).skip(1)`;

    expect(ret).to.equal(expected);
  });
});
