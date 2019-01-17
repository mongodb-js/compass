import reducer, {
  loadDatabases,
  LOAD_DATABASES
} from 'modules/databases';

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

describe('databases module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      context('when the action is LOAD_DATABASES', () => {
        const databases = [ SPOTIFY, SOUNDCLOUD, DEEZER ];

        it('returns the mapped datbases list', () => {
          expect(reducer(undefined, loadDatabases(databases))).
            to.deep.equal([ SPOTIFY, SOUNDCLOUD, DEEZER ]);
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
});
