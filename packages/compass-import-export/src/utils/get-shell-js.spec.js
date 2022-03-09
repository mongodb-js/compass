import {ObjectId} from 'bson';
import getShellJS from './get-shell-js';

describe('get-shell-js', function() {
  it('should support simple query', function() {
    const ret = getShellJS('lucas.pets', { filter: { name: 'Arlo' } });
    const expected = `db.pets.find(
  {name: 'Arlo'}
)`;
    expect(ret).to.equal(expected);
  });
  it('should support simple ObjectId', function() {
    const ret = getShellJS('lucas.pets', { filter: { _id: new ObjectId('deadbeefdeadbeefdeadbeef') } });
    const expected = `db.pets.find(
  {_id: ObjectId('deadbeefdeadbeefdeadbeef')}
)`;
    expect(ret).to.equal(expected);
  });
  it('should support a projection', function() {
    const ret = getShellJS('lucas.pets', {
      filter: { name: 'Arlo' },
      project: { name: 1 }
    });
    const expected = `db.pets.find(
  {name: 'Arlo'},
  {name: 1}
)`;
    expect(ret).to.equal(expected);
  });
  it('should support a skip', function() {
    const ret = getShellJS('lucas.pets', {
      filter: { name: 'Arlo' },
      project: { name: 1 },
      limit: 100
    });
    const expected = `db.pets.find(
  {name: 'Arlo'},
  {name: 1}
).limit(100)`;

    expect(ret).to.equal(expected);
  });
  it('should support a limit', function() {
    const ret = getShellJS('lucas.pets', {
      filter: { name: 'Arlo' },
      project: { name: 1 },
      limit: 100,
      skip: 1
    });
    const expected = `db.pets.find(
  {name: 'Arlo'},
  {name: 1}
).limit(100).skip(1)`;

    expect(ret).to.equal(expected);
  });
});
