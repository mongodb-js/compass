import { getConnectionTitle } from './connection-title';
import { expect } from 'chai';

describe('getConnectionTitle', function () {
  it('works with default host', function () {
    expect(
      getConnectionTitle({
        connectionString: 'mongodb://localhost:27017',
      })
    ).to.equal('localhost:27017');
  });

  it('returns the hostname if the connection is srv', function () {
    expect(
      getConnectionTitle({
        connectionString: 'mongodb+srv://somehost',
      })
    ).to.equal('somehost');
  });

  it('returns hosts if the connection is not srv', function () {
    expect(
      getConnectionTitle({
        connectionString: 'mongodb://example.com:12345,example123.com:123452/',
      })
    ).to.equal('example.com:12345,example123.com:123452');
  });

  it('returns the name of the favorite if connection is favorite', function () {
    expect(
      getConnectionTitle({
        connectionString: 'somethingwrong',
        favorite: {
          name: 'Favorite Name',
        },
      })
    ).to.equal('Favorite Name');
  });

  it('falls back to hostname:port if nothing else match', function () {
    expect(
      getConnectionTitle({
        connectionString: 'mongodb://somehost:12345',
      })
    ).to.equal('somehost:12345');
  });
});
