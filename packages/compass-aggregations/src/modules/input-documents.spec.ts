import reducer, {
  toggleInputDocumentsCollapsed,
  updateInputDocuments,
  loadingInputDocuments,
  ActionTypes,
} from './input-documents';
import { expect } from 'chai';

describe('input documents module', function () {
  describe('#toggleInputDocumentsCollapsed', function () {
    it('returns the ActionTypes.CollapseToggled action', function () {
      expect(toggleInputDocumentsCollapsed()).to.deep.equal({
        type: ActionTypes.CollapseToggled,
      });
    });
  });

  describe('#loadingInputDocuments', function () {
    it('returns the ActionTypes.DocumentsFetchStarted action', function () {
      expect(loadingInputDocuments()).to.deep.equal({
        type: ActionTypes.DocumentsFetchStarted,
      });
    });
  });

  describe('#updateInputDocuments', function () {
    it('returns the ActionTypes.DocumentsFetchFinished action', function () {
      expect(updateInputDocuments(10, [], null)).to.deep.equal({
        type: ActionTypes.DocumentsFetchFinished,
        count: 10,
        documents: [],
        error: null,
      });
    });
  });

  describe('#refreshInputDocuments', function () {
    context('when the data service is connected', function () {
      context('when the count succeeds', function () {
        context('when the aggregation succeeds', function () {
          it('sets the count and documents in the state', function () {});
        });

        context('when the aggregation fails', function () {
          it('sets the error in the state', function () {});
        });
      });

      context('when the count fails', function () {
        it('sets the error in the state', function () {});
      });
    });

    context('when the dataservice is not connected', function () {
      it('sets the error in the state', function () {});
    });
  });

  describe('#reducer', function () {
    context(
      'when the action is not toggle input documents collapsed',
      function () {
        it('returns the default state', function () {
          expect(reducer(undefined, { type: 'test' })).to.deep.equal({
            documents: [],
            error: null,
            isExpanded: true,
            count: null,
            isLoading: false,
          });
        });
      }
    );

    context('when the action is toggle input documents collapsed', function () {
      it('returns the new state', function () {
        expect(
          reducer(undefined, toggleInputDocumentsCollapsed())
        ).to.deep.equal({
          documents: [],
          error: null,
          isExpanded: false,
          count: null,
          isLoading: false,
        });
      });
    });
  });
});
