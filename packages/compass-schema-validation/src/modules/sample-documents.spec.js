import reducer, {
  loadingSampleDocuments,
  LOADING_SAMPLE_DOCUMENTS
} from 'modules/sample-documents';

describe('sample-documents module', () => {
  describe('#loadingSampleDocuments', () => {
    it('returns the LOADING_SAMPLE_DOCUMENTS action', () => {
      expect(loadingSampleDocuments()).to.deep.equal({
        type: LOADING_SAMPLE_DOCUMENTS
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not presented in sample-documents module', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          isLoading: false
        });
      });
    });

    context('when the action is loadingSampleDocuments', () => {
      it('returns the new state', () => {
        const sampleDocuments = reducer(undefined, loadingSampleDocuments());

        expect(sampleDocuments.isLoading).to.equal(true);
      });
    });
  });
});
