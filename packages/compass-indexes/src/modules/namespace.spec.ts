import { expect } from 'chai';

import reducer, { namespaceChanged, NAMESPACE_CHANGED } from './namespace';

describe('namespace module', function () {
  describe('#namespaceChanged', function () {
    it('returns the NAMESPACE_CHANGED action', function () {
      expect(namespaceChanged('db.coll')).to.deep.equal({
        type: NAMESPACE_CHANGED,
        namespace: 'db.coll',
      });
    });
  });

  describe('#reducer', function () {
    context('when the action is not namespace changed', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.equal('');
      });
    });

    context('when the action is namespace changed', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, namespaceChanged('db.coll'))).to.equal(
          'db.coll'
        );
      });
    });
  });
});
