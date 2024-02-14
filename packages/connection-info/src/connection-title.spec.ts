import { getConnectionTitle } from './connection-title';
import { expect } from 'chai';

describe('getConnectionTitle', function () {
  it('works with default host', function () {
    expect(
      getConnectionTitle({
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
        },
      })
    ).to.equal('localhost:27017');
  });

  it('returns the hostname if the connection is srv', function () {
    expect(
      getConnectionTitle({
        connectionOptions: {
          connectionString: 'mongodb+srv://somehost',
        },
      })
    ).to.equal('somehost');
  });

  it('returns hosts if the connection is not srv', function () {
    expect(
      getConnectionTitle({
        connectionOptions: {
          connectionString:
            'mongodb://example.com:12345,example123.com:123452/',
        },
      })
    ).to.equal('example.com:12345,example123.com:123452');
  });

  it('returns the name of the favorite if connection is favorite', function () {
    expect(
      getConnectionTitle({
        connectionOptions: {
          connectionString: 'somethingwrong',
        },
        favorite: {
          name: 'Favorite Name',
        },
      })
    ).to.equal('Favorite Name');
  });

  it('falls back to hostname:port if nothing else match', function () {
    expect(
      getConnectionTitle({
        connectionOptions: {
          connectionString: 'mongodb://somehost:12345',
        },
      })
    ).to.equal('somehost:12345');
  });

  it('falls back to connection string if it is an invalid connection string', function () {
    expect(
      getConnectionTitle({
        connectionOptions: {
          connectionString: 'pineapple',
        },
      })
    ).to.equal('pineapple');
  });

  it('falls back to the default name Connection if there is no connection string', function () {
    expect(
      getConnectionTitle({
        connectionOptions: {
          connectionString: '',
        },
      })
    ).to.equal('Connection');
  });
});
