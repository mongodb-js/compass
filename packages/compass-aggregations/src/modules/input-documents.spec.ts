import { expect } from 'chai';
import { defaultPreferencesInstance } from 'compass-preferences-model';
import sinon from 'sinon';

import reducer, {
  toggleInputDocumentsCollapsed,
  updateInputDocuments,
  loadingInputDocuments,
  refreshInputDocuments,
  ActionTypes,
} from './input-documents';
import type { RootState } from '.';
import type { DataService } from './data-service';

describe('input documents module', function () {
  afterEach(function () {
    sinon.restore();
  });

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

  describe('#refreshInputDocuments', function () {
    it('should apply maxTimeMS to the aggregation when it is set', async function () {
      const refreshInputDocumentsThunk = refreshInputDocuments();

      const mockAggregate = sinon.stub().resolves([]);
      const mockState: Partial<RootState> = {
        dataService: {
          dataService: {
            aggregate: mockAggregate,
          } as unknown as DataService,
        },
        namespace: 'test.namespace',
        maxTimeMS: undefined,
        settings: {
          isExpanded: false,
          isCommentMode: false,
          isDirty: false,
          limit: 10,
          sampleSize: 10,
        },
      };

      await refreshInputDocumentsThunk(
        sinon.stub(),
        () => mockState as RootState,
        { preferences: defaultPreferencesInstance } as any
      );

      expect(mockAggregate.calledOnce).to.be.true;
      expect(mockAggregate.firstCall.args[2]).to.deep.equal({
        maxTimeMS: 60_000,
      });

      mockState.maxTimeMS = 1000;
      await refreshInputDocumentsThunk(
        sinon.stub(),
        () => mockState as RootState,
        { preferences: defaultPreferencesInstance } as any
      );

      expect(mockAggregate.calledTwice).to.be.true;
      expect(mockAggregate.secondCall.args[2]).to.deep.equal({
        maxTimeMS: 1000,
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
