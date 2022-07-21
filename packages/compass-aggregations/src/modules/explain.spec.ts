import type { Store } from 'redux';
import type { RootState } from '.';
import { ExplainVerbosity } from 'mongodb';
import { expect } from 'chai';
import reducer, {
  INITIAL_STATE,
  ActionTypes,
  explainAggregation,
  closeExplainModal,
  cancelExplain,
  _getExplainVerbosity,
  _mapIndexesInformation,
} from './explain';
import configureStore from '../stores/store';
import { DATA_SERVICE_CONNECTED } from './data-service';
import type { IndexInfo } from './indexes';

describe('explain module', function () {
  describe('#reducer', function () {
    it('returns state when explain starts', function () {
      const abortController = new AbortController();
      expect(reducer(undefined, {
        type: ActionTypes.ExplainStarted,
        abortController,
      })).to.deep.equal({
        isModalOpen: true,
        isLoading: true,
        explain: undefined,
        error: undefined,
        abortController,
      });
    });
    it('returns state when explain finishes', function () {
      const explain = {
        plan: {
          nodes: [],
        },
        stats: {
          executionTimeMillis: 10,
          nReturned: 32,
          indexes: [{ index: '_id', shard: 'shard01', key: { _id: -1 } }],
        },
      };
      expect(reducer(undefined, {
        type: ActionTypes.ExplainFinished,
        explain,
      })).to.deep.equal({
        isModalOpen: true,
        isLoading: false,
        explain,
        error: undefined,
        abortController: undefined,
      });
    });
    it('returns state when explain fails', function () {
      expect(reducer(undefined, {
        type: ActionTypes.ExplainFailed,
        error: 'error',
      })).to.deep.equal({
        isModalOpen: true,
        isLoading: false,
        explain: undefined,
        error: 'error',
        abortController: undefined,
      });
    });
    it('returns state when explain is cancelled', function () {
      expect(reducer(undefined, {
        type: ActionTypes.ExplainCancelled,
      })).to.deep.equal(INITIAL_STATE);
    });
    it('when returns initial state by default', function () {
      expect(reducer(undefined, {
        type: 'unknown',
      })).to.deep.equal(INITIAL_STATE);
    });
  });
  describe('#actions', function () {
    let store: Store<RootState>;
    before(function () {
      store = configureStore({});
      store.dispatch({
        type: DATA_SERVICE_CONNECTED,
        dataService: new class {
          explainAggregate() {
            return Promise.resolve({ explainVersion: 2 })
          }
        }
      });
    });
    it('explains aggregation', async function () {
      await store.dispatch(explainAggregation() as any);
      expect(store.getState().explain).to.deep.equal({
        isModalOpen: true,
        isLoading: false,
        explain: { plan: { explainVersion: 2 } },
        error: undefined,
        abortController: undefined
      });
    });
    it('closes explain modal', async function () {
      await store.dispatch(closeExplainModal() as any);
      expect(store.getState().explain).to.deep.equal(INITIAL_STATE);
    });
    it('cancels explain', async function () {
      await store.dispatch(cancelExplain() as any);
      expect(store.getState().explain).to.deep.equal(INITIAL_STATE);
    });
  });
  describe('#methods', function () {
    it('gets explain verbosity', function () {
      expect(
        _getExplainVerbosity([], true),
        'verbosity is queryPlannerExtended for data lake'
      ).to.equal(ExplainVerbosity.queryPlannerExtended);

      expect(
        _getExplainVerbosity([{ $out: 'some_collection' }], false),
        'verbosity is queryPlanner by for $out'
      ).to.equal(ExplainVerbosity.queryPlanner);

      expect(
        _getExplainVerbosity([{ $merge: 'some_collection' }], false),
        'verbosity is queryPlanner by for $merge'
      ).to.equal(ExplainVerbosity.queryPlanner);

      expect(
        _getExplainVerbosity([], false),
        'verbosity is queryPlanner by default'
      ).to.equal(ExplainVerbosity.allPlansExecution);
    });

    it('maps indexes correctly', function () {
      const collectionIndexes: IndexInfo[] = [
        { ns: 'test.users', name: '_id_', key: { _id: 1 }, extra: {} },
        { ns: 'test.users', name: '_location_', key: { _address: '2dsphere' }, extra: {} }
      ];
      const explainIndexes = [
        { index: '_id_', shard: 'shard01' },
        { index: null, shard: 'shard02' },
        { index: 'non_existant_1', shard: 'shard02' },
        { index: 'non_existant_2', shard: null },
      ];
      const expected = [
        { name: '_id_', shard: 'shard01', key: { _id: 1 } },
        { name: 'non_existant_1', shard: 'shard02', key: {} },
        { name: 'non_existant_2', shard: null, key: {} },
      ];

      expect(
        _mapIndexesInformation(collectionIndexes, explainIndexes)
      ).to.deep.equal(expected);
    });
  });
});
