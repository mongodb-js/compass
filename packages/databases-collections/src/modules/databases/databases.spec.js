import reducer, {
  loadDatabases,
  sortDatabases,
  LOAD_DATABASES
} from './databases';
import { UPDATE_SORT } from '../sort';

const SPOTIFY = {
  _id: 'spotify',
  collectionsLength: 4,
  index_count: 10,
  storage_size: 15
};
const SOUNDCLOUD = {
  _id: 'soundcloud',
  collectionsLength: 1,
  index_count: 15,
  storage_size: 20
};
const DEEZER = {
  _id: 'deezer',
  collectionsLength: 2,
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
      context('when the action is LOAD_DATABASES', () => {
        const databases = [ SPOTIFY, SOUNDCLOUD, DEEZER ];

        it('returns the mapped datbases list', () => {
          expect(reducer(undefined, loadDatabases(databases))).
            to.deep.equal([ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ]);
        });
      });

      context('when the action is SORT_DATABASES', () => {
        const databases = [ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ];

        context('when providing a column', () => {
          context('when the column is Datbase Name', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortDatabases(databases, 'Database Name', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortDatabases(databases, 'Database Name', 'desc'))).
                  to.deep.equal([ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ]);
              });
            });
          });

          context('when the column is Storage Size', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortDatabases(databases, 'Storage Size', 'asc'))).
                  to.deep.equal([ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortDatabases(databases, 'Storage Size', 'desc'))).
                  to.deep.equal([ DEEZER_MAPPED, SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED ]);
              });
            });
          });

          context('when the column is Collections', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortDatabases(databases, 'Collections', 'asc'))).
                  to.deep.equal([ SOUNDCLOUD_MAPPED, DEEZER_MAPPED, SPOTIFY_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortDatabases(databases, 'Collections', 'desc'))).
                  to.deep.equal([ SPOTIFY_MAPPED, DEEZER_MAPPED, SOUNDCLOUD_MAPPED ]);
              });
            });
          });

          context('when the column is Indexes', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortDatabases(databases, 'Indexes', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortDatabases(databases, 'Indexes', 'desc'))).
                  to.deep.equal([ SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED, DEEZER_MAPPED ]);
              });
            });
          });
        });
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.deep.equal([]);
      });
    });
  });

  describe('#loadDatabases', () => {
    it('returns the action', () => {
      expect(loadDatabases([])).to.deep.equal({ type: LOAD_DATABASES, databases: [] });
    });
  });

  describe('#sortDatabases', () => {
    it('returns the action', () => {
      expect(sortDatabases([], 'Database Name', 'desc')).to.deep.equal({
        type: UPDATE_SORT,
        databases: [],
        column: 'Database Name',
        order: 'desc'
      });
    });
  });
});
