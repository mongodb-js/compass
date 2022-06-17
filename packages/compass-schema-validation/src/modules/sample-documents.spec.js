import { expect } from 'chai';

import reducer, {
  loadingSampleDocuments,
  LOADING_SAMPLE_DOCUMENTS,
} from './sample-documents';

describe('sample-documents module', function () {
  describe('#loadingSampleDocuments', function () {
    it('returns the LOADING_SAMPLE_DOCUMENTS action', function () {
      expect(loadingSampleDocuments()).to.deep.equal({
        type: LOADING_SAMPLE_DOCUMENTS,
      });
    });
  });

  describe('#reducer', function () {
    context(
      'when the action is not presented in sample-documents module',
      function () {
        it('returns the default state', function () {
          expect(reducer(undefined, { type: 'test' })).to.deep.equal({
            isLoading: false,
          });
        });
      }
    );

    context('when the action is loadingSampleDocuments', function () {
      it('returns the new state', function () {
        const sampleDocuments = reducer(undefined, loadingSampleDocuments());

        expect(sampleDocuments.isLoading).to.equal(true);
      });
    });
  });
});
