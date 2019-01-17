import reducer, {
  loadCollections,
  sortCollections,
  LOAD_COLLECTIONS,
  SORT_COLLECTIONS
} from 'modules/collections';

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
  'Properties': { locale: 'se' }
};
const SOUNDCLOUD_MAPPED = {
  'Collection Name': 'soundcloud',
  'Documents': 100,
  'Avg. Document Size': 200,
  'Total Document Size': 20000,
  'Num. Indexes': 2,
  'Total Index Size': 20,
  'Properties': { locale: 'de' }
};
const DEEZER_MAPPED = {
  'Collection Name': 'deezer',
  'Documents': 5,
  'Avg. Document Size': 4,
  'Total Document Size': 20,
  'Num. Indexes': 3,
  'Total Index Size': 1,
  'Properties': { locale: 'us' }
};

describe('collections module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      context('when the action is LOAD_COLLECTIONS', () => {
        const collections = [ SPOTIFY, SOUNDCLOUD, DEEZER ];

        it('returns the mapped datbases list', () => {
          expect(reducer(undefined, loadCollections(collections))).
            to.deep.equal([ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ]);
        });
      });

      context('when the action is SORT_COLLECTIONS', () => {
        const collections = [ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ];

        context('when providing a column', () => {
          context('when the column is Datbase Name', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortCollections(collections, 'Collection Name', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortCollections(collections, 'Collection Name', 'desc'))).
                  to.deep.equal([ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ]);
              });
            });
          });

          context('when the column is Documents', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortCollections(collections, 'Documents', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortCollections(collections, 'Documents', 'desc'))).
                  to.deep.equal([ SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED, DEEZER_MAPPED ]);
              });
            });
          });

          context('when the column is Avg. Document Size', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortCollections(collections, 'Avg. Document Size', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortCollections(collections, 'Avg. Document Size', 'desc'))).
                  to.deep.equal([ SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED, DEEZER_MAPPED ]);
              });
            });
          });

          context('when the column is Total Document Size', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortCollections(collections, 'Total Document Size', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortCollections(collections, 'Total Document Size', 'desc'))).
                  to.deep.equal([ SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED, DEEZER_MAPPED ]);
              });
            });
          });

          context('when the column is Num. Indexes', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortCollections(collections, 'Num. Indexes', 'asc'))).
                  to.deep.equal([ SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED, DEEZER_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortCollections(collections, 'Num. Indexes', 'desc'))).
                  to.deep.equal([ DEEZER_MAPPED, SOUNDCLOUD_MAPPED, SPOTIFY_MAPPED ]);
              });
            });
          });

          context('when the column is Total Index Size', () => {
            context('when sorting asc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortCollections(collections, 'Total Index Size', 'asc'))).
                  to.deep.equal([ DEEZER_MAPPED, SPOTIFY_MAPPED, SOUNDCLOUD_MAPPED ]);
              });
            });

            context('when sorting desc', () => {
              it('returns the sorted datbases list', () => {
                expect(reducer(undefined, sortCollections(collections, 'Total Index Size', 'desc'))).
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

  describe('#loadCollections', () => {
    it('returns the action', () => {
      expect(loadCollections([])).to.deep.equal({ type: LOAD_COLLECTIONS, collections: [] });
    });
  });

  describe('#sortCollections', () => {
    it('returns the action', () => {
      expect(sortCollections([], 'Collection Name', 'desc')).to.deep.equal({
        type: SORT_COLLECTIONS,
        collections: [],
        column: 'Collection Name',
        order: 'desc'
      });
    });
  });
});
