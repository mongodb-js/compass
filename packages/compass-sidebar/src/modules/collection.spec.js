import {
  getSource,
  getSourceName,
  getSourceViewOn,
  collectionMetadata
} from 'modules/collection';

const COLL = {
  _id: 'db.test',
  readonly: false
};

const VIEW = {
  _id: 'db.testView',
  readonly: true,
  view_on: 'test',
  pipeline: []
};

const VIEW_ON_VIEW = {
  _id: 'db.testViewOnView',
  readonly: true,
  view_on: 'testView',
  pipeline: []
};

const COLLECTIONS = [ COLL, VIEW, VIEW_ON_VIEW ];

describe('collection module', () => {
  describe('#getSource', () => {
    context('when the name matches', () => {
      it('returns the source', () => {
        expect(getSource('testView', COLLECTIONS)._id).to.equal('db.testView');
      });
    });

    context('when the name does not match', () => {
      it('returns undefined', () => {
        expect(getSource('notFound', COLLECTIONS)).to.equal(undefined);
      });
    });
  });

  describe('#getSourceName', () => {
    context('when the collection is a view', () => {
      it('returns the source name', () => {
        expect(getSourceName(VIEW.readonly, 'db', 'testView')).to.equal('db.testView');
      });
    });

    context('when the collection is not a view', () => {
      it('returns null', () => {
        expect(getSourceName(COLL.readonly)).to.equal(null);
      });
    });
  });

  describe('#getSourceViewOn', () => {
    context('when the source is a view', () => {
      it('returns the view namespace', () => {
        expect(getSourceViewOn('db', VIEW)).to.equal('db.test');
      });
    });

    context('when the source is not a view', () => {
      it('returns null', () => {
        expect(getSourceViewOn('db')).to.equal(null);
      });
    });
  });

  describe('#collectionMetadata', () => {
    it('returns the object to send to the other plugins', () => {
      expect(collectionMetadata(VIEW_ON_VIEW, COLLECTIONS, 'db', 'db.testView')).to.deep.equal({
        namespace: 'db.testViewOnView',
        isReadonly: true,
        sourceName: 'db.testView',
        isSourceReadonly: true,
        sourceViewOn: 'db.test',
        sourcePipeline: [],
        editViewName: 'db.testView'
      });
    });
  });
});
