import { expect } from 'chai';

import {
  getSource,
  getSourceName,
  getSourceViewOn,
} from './collection';

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

const TIME_SERIES = {
  _id: 'db.testTimeSeries',
  type: 'timeSeries',
  readonly: false
};

const COLLECTIONS = [ COLL, VIEW, VIEW_ON_VIEW, TIME_SERIES ];

describe('collection module', function () {
  describe('#getSource', function () {
    context('when the name matches', function () {
      it('returns the source', function () {
        expect(getSource('testView', COLLECTIONS)._id).to.equal('db.testView');
      });
    });

    context('when the name does not match', function () {
      it('returns undefined', function () {
        expect(getSource('notFound', COLLECTIONS)).to.equal(undefined);
      });
    });
  });

  describe('#getSourceName', function () {
    context('when the collection is a view', function () {
      it('returns the source name', function () {
        expect(getSourceName(VIEW.readonly, 'db', 'testView')).to.equal('db.testView');
      });
    });

    context('when the collection is not a view', function () {
      it('returns null', function () {
        expect(getSourceName(COLL.readonly)).to.equal(null);
      });
    });

    context('when the collection is readonly but not a view', function () {
      it('returns null', function () {
        expect(getSourceName(true, 'db', undefined)).to.equal(null);
      });
    });
  });

  describe('#getSourceViewOn', function () {
    context('when the source is a view', function () {
      it('returns the view namespace', function () {
        expect(getSourceViewOn('db', VIEW)).to.equal('db.test');
      });
    });

    context('when the source is not a view', function () {
      it('returns null', function () {
        expect(getSourceViewOn('db')).to.equal(null);
      });
    });
  });
});
