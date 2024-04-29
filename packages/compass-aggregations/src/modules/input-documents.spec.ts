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
      expect(updateInputDocuments([], null)).to.deep.equal({
        type: ActionTypes.DocumentsFetchFinished,
        documents: [],
        error: null,
      });
    });
  });

  describe('#reducer', function () {
    context(
      'when the action is not toggle input documents collapsed',
      function () {
        it('returns the default state', function () {
          expect(reducer(undefined, { type: 'test' } as any)).to.deep.equal({
            documents: [],
            error: null,
            isExpanded: true,
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
          isLoading: false,
        });
      });
    });
  });
});
