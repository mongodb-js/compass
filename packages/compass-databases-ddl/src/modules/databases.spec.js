import reducer, { sortDatabases } from 'modules/databases';

const SPOTIFY = {
  _id: 'spotify',
  collections: [ 1, 2, 3, 4],
  index_count: 10,
  storage_size: 15
};
const SOUNDCLOUD = {
  _id: 'soundcloud',
  collections: [ 1 ],
  index_count: 15,
  storage_size: 20
};
const DEEZER = {
  _id: 'deezer',
  collections: [ 1, 2 ],
  index_count: 1,
  storage_size: 100
};

const SPOTIFY_MAPPED = {
  'Database Name': 'spotify',
  'Collections': 4,
  'Indexes': 10,
  'Storage Size': 15
};
const SOUNDCLOUD_MAPPED = {
  'Database Name': 'soundcloud',
  'Collections': 1,
  'Indexes': 15,
  'Storage Size': 20
};
const DEEZER_MAPPED = {
  'Database Name': 'deezer',
  'Collections': 2,
  'Indexes': 1,
  'Storage Size': 100
};

describe('databases module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      context('when the action is SORT_DATABASES', () => {
        const databases = [ SPOTIFY, SOUNDCLOUD, DEEZER ];

        context('when providing a column', () => {
          context('when the column is Datbase Name', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(databases, sortDatabases('Database Name', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(databases, sortDatabases('Database Name', 'desc'))).
                  to.deep.equal([ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ]);
              });
            });
          });

          context('when the column is Storage Size', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(databases, sortDatabases('Storage Size', 'asc'))).
                  to.deep.equal([ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(databases, sortDatabases('Storage Size', 'desc'))).
                  to.deep.equal([ DEEZER_MAPPED, SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED ]);
              });
            });
          });

          context('when the column is Collections', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(databases, sortDatabases('Collections', 'asc'))).
                  to.deep.equal([ SOUNDCLOUD_MAPPED, DEEZER_MAPPED, SPOTIFY_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(databases, sortDatabases('Collections', 'desc'))).
                  to.deep.equal([ SPOTIFY_MAPPED, DEEZER_MAPPED, SOUNDCLOUD_MAPPED ]);
              });
            });
          });

          context('when the column is Indexes', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(databases, sortDatabases('Indexes', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(databases, sortDatabases('Indexes', 'desc'))).
                  to.deep.equal([ SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED, DEEZER_MAPPED ]);
              });
            });
          });
        });
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(null);
      });
    });
  });
});

