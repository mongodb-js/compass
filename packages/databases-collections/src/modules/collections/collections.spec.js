import { expect } from 'chai';
import reducer, { setCollections } from './collections';

const SPOTIFY = {
  name: 'spotify',
  document_count: 10,
  size: 200,
  index_count: 1,
  index_size: 15,
  collation: { locale: 'se' },
};
const SOUNDCLOUD = {
  name: 'soundcloud',
  document_count: 100,
  size: 20000,
  index_count: 2,
  index_size: 20,
  collation: { locale: 'de' },
};
const DEEZER = {
  name: 'deezer',
  document_count: 5,
  size: 20,
  index_count: 3,
  index_size: 1,
  collation: { locale: 'us' },
};

describe('collections module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      context('when the action is LOAD_COLLECTIONS', function () {
        const collections = [SPOTIFY, SOUNDCLOUD, DEEZER];

        it('returns the mapped databases list', function () {
          expect(reducer(undefined, setCollections(collections))).to.deep.equal(
            collections
          );
        });
      });
    });
  });
});
