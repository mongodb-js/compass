import reducer, {
  loadCollections,
  sortCollections,
  LOAD_COLLECTIONS
} from './collections';
import { UPDATE_SORT } from '../sort';

const SPOTIFY = {
  name: 'spotify',
  document_count: 10,
  size: 200,
  index_count: 1,
  index_size: 15,
  collation: { locale: 'se' }
};
const SOUNDCLOUD = {
  name: 'soundcloud',
  document_count: 100,
  size: 20000,
  index_count: 2,
  index_size: 20,
  collation: { locale: 'de' }
};
const DEEZER = {
  name: 'deezer',
  document_count: 5,
  size: 20,
  index_count: 3,
  index_size: 1,
  collation: { locale: 'us' }
};

const SPOTIFY_MAPPED = {
  'Collection Name': 'spotify',
  'Documents': 10,
  'Avg. Document Size': 20,
  'Total Document Size': 200,
  'Num. Indexes': 1,
  'Total Index Size': 15,
  'Properties': [{ name: 'collation', options: { locale: 'se' }}],
  '_id': undefined,
  'readonly': undefined,
  'capped': undefined,
  'pipeline': undefined,
  'view_on': undefined,
  'type': undefined
};
const SOUNDCLOUD_MAPPED = {
  'Collection Name': 'soundcloud',
  'Documents': 100,
  'Avg. Document Size': 200,
  'Total Document Size': 20000,
  'Num. Indexes': 2,
  'Total Index Size': 20,
  'Properties': [{ name: 'collation', options: { locale: 'de' }}],
  '_id': undefined,
  'readonly': undefined,
  'capped': undefined,
  'pipeline': undefined,
  'view_on': undefined,
  'type': undefined
};
const DEEZER_MAPPED = {
  'Collection Name': 'deezer',
  'Documents': 5,
  'Avg. Document Size': 4,
  'Total Document Size': 20,
  'Num. Indexes': 3,
  'Total Index Size': 1,
  'Properties': [{ name: 'collation', options: { locale: 'us' }}],
  '_id': undefined,
  'readonly': undefined,
  'capped': undefined,
  'pipeline': undefined,
  'view_on': undefined,
  'type': undefined
};

describe('collections module', () => {
  describe('#reducer', () => {
    it('parses properties', () => {
      const parseProperties = (coll) => {
        return reducer(undefined, loadCollections([
          coll
        ]))[0].Properties;
      };

      expect(parseProperties({
        name: 'coll1', readonly: true
      })).to.deep.equal([
        { name: 'readonly', options: {} }
      ]);

      expect(parseProperties({
        name: 'coll1', type: 'timeseries'
      })).to.deep.equal([
        { name: 'time-series', options: {} }
      ]);

      expect(parseProperties({
        name: 'coll1', capped: true,
      })).to.deep.equal([
        { name: 'capped', options: {} }
      ]);

      expect(parseProperties({
        name: 'coll1', collation: { locale: 'se' }
      })).to.deep.equal([
        { name: 'collation', options: { locale: 'se' }}
      ]);

      expect(parseProperties({
        name: 'coll1', type: 'view'
      })).to.deep.equal([
        { name: 'view', options: {} }
      ]);

      expect(parseProperties({
        name: 'coll1', type: 'view', readonly: true
      })).to.deep.equal([
        { name: 'view', options: {} },
        { name: 'readonly', options: {} }
      ]);
    });

    context('when an action is provided', () => {
      context('when the action is LOAD_COLLECTIONS', () => {
        const collections = [ SPOTIFY, SOUNDCLOUD, DEEZER ];

        it('returns the mapped databases list', () => {
          expect(reducer(undefined, loadCollections(collections))).
            to.deep.equal([ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ]);
        });
      });

      context('when the action is UPDATE_SORT', () => {
        const collections = [ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ];

        context('when providing a column', () => {
          context('when the column is Database Name', () => {
            context('when sorting asc', () => {
              it('returns the sorted databases list', () => {
                expect(reducer(collections, sortCollections('Collection Name', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted databases list', () => {
                expect(reducer(collections, sortCollections('Collection Name', 'desc'))).
                  to.deep.equal([ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ]);
              });
            });
          });

          context('when the column is Documents', () => {
            context('when sorting asc', () => {
              it('returns the sorted databases list', () => {
                expect(reducer(collections, sortCollections('Documents', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted databases list', () => {
                expect(reducer(collections, sortCollections('Documents', 'desc'))).
                  to.deep.equal([ SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED, DEEZER_MAPPED ]);
              });
            });
          });

          context('when the column is Avg. Document Size', () => {
            context('when sorting asc', () => {
              it('returns the sorted databases list', () => {
                expect(reducer(collections, sortCollections('Avg. Document Size', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted databases list', () => {
                expect(reducer(collections, sortCollections('Avg. Document Size', 'desc'))).
                  to.deep.equal([ SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED, DEEZER_MAPPED ]);
              });
            });
          });

          context('when the column is Total Document Size', () => {
            context('when sorting asc', () => {
              it('returns the sorted databases list', () => {
                expect(reducer(collections, sortCollections('Total Document Size', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted databases list', () => {
                expect(reducer(collections, sortCollections('Total Document Size', 'desc'))).
                  to.deep.equal([ SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED, DEEZER_MAPPED ]);
              });
            });
          });

          context('when the column is Num. Indexes', () => {
            context('when sorting asc', () => {
              it('returns the sorted databases list', () => {
                expect(reducer(collections, sortCollections('Num. Indexes', 'asc'))).
                  to.deep.equal([ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted databases list', () => {
                expect(reducer(collections, sortCollections('Num. Indexes', 'desc'))).
                  to.deep.equal([ DEEZER_MAPPED, SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED ]);
              });
            });
          });

          context('when the column is Total Index Size', () => {
            context('when sorting asc', () => {
              it('returns the sorted databases list', () => {
                expect(reducer(collections, sortCollections('Total Index Size', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted databases list', () => {
                expect(reducer(collections, sortCollections('Total Index Size', 'desc'))).
                  to.deep.equal([ SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED, DEEZER_MAPPED ]);
              });
            });
          });
        });
      });
    });
  });
});
