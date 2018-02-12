import reducer, {
  toggleInputDocumentsCollapsed,
  TOGGLE_INPUT_COLLAPSED
} from 'modules/input-documents';

describe('input documents module', () => {
  describe('#toggleInputDocumentsCollapsed', () => {
    it('returns the TOGGLE_INPUT_COLLAPSED action', () => {
      expect(toggleInputDocumentsCollapsed()).to.deep.equal({
        type: TOGGLE_INPUT_COLLAPSED
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
          count: 0
        });
      });
    });

    context('when the action is toggle input documents collapsed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleInputDocumentsCollapsed())).to.deep.equal({
          documents: [],
          error: null,
          isExpanded: false,
          count: 0
        });
      });
    });
  });
});
