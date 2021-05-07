import reducer, {
  toggleInputDocumentsCollapsed,
  updateInputDocuments,
  loadingInputDocuments,
  TOGGLE_INPUT_COLLAPSED,
  UPDATE_INPUT_DOCUMENTS,
  LOADING_INPUT_DOCUMENTS
} from 'modules/input-documents';

describe('input documents module', () => {
  describe('#toggleInputDocumentsCollapsed', () => {
    it('returns the TOGGLE_INPUT_COLLAPSED action', () => {
      expect(toggleInputDocumentsCollapsed()).to.deep.equal({
        type: TOGGLE_INPUT_COLLAPSED
      });
    });
  });

  describe('#loadingInputDocuments', () => {
    it('returns the LOADING_INPUT_DOCUMENTS action', () => {
      expect(loadingInputDocuments()).to.deep.equal({
        type: LOADING_INPUT_DOCUMENTS
      });
    });
  });

  describe('#updateInputDocuments', () => {
    it('returns the TOGGLE_INPUT_COLLAPSED action', () => {
      expect(updateInputDocuments(10, [], null)).to.deep.equal({
        type: UPDATE_INPUT_DOCUMENTS,
        count: 10,
        documents: [],
        error: null
      });
    });
  });

  describe('#refreshInputDocuments', () => {
    context('when the data service is connected', () => {
      context('when the count succeeds', () => {
        context('when the aggregation succeeds', () => {
          it('sets the count and documents in the state', () => {

          });
        });

        context('when the aggregation fails', () => {
          it('sets the error in the state', () => {

          });
        });
      });

      context('when the count fails', () => {
        it('sets the error in the state', () => {

        });
      });
    });

    context('when the dataservice is not connected', () => {
      it('sets the error in the state', () => {

      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not toggle input documents collapsed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          documents: [],
          error: null,
          isExpanded: true,
          count: 0,
          isLoading: false
        });
      });
    });

    context('when the action is toggle input documents collapsed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleInputDocumentsCollapsed())).to.deep.equal({
          documents: [],
          error: null,
          isExpanded: false,
          count: 0,
          isLoading: false
        });
      });
    });
  });
});
