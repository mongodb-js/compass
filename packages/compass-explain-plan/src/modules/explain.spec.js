import { expect } from 'chai';
import { omit } from 'lodash';
import explainStates from '../constants/explain-states';

import reducer, {
  isAggregationExplainOutput,
  switchToTreeView,
  switchToJSONView,
  explainStateChanged,
  explainPlanFetched,
  SWITCHED_TO_TREE_VIEW,
  SWITCHED_TO_JSON_VIEW,
  EXPLAIN_STATE_CHANGED,
  EXPLAIN_PLAN_FETCHED,
} from './explain';

const explainExample = {
  error: null,
  errorParsing: false,
  abortController: null,
  executionSuccess: true,
  executionTimeMillis: 6,
  explainState: 'executed',
  inMemorySort: false,
  index: null,
  indexType: 'COLLSCAN',
  isCollectionScan: true,
  isCovered: false,
  isMultiKey: false,
  isSharded: false,
  nReturned: 18801,
  namespace: 'db.coll',
  numShards: 0,
  parsedQuery: {},
  executionStats: {},
  originalExplainData: {},
  totalDocsExamined: 18801,
  totalKeysExamined: 0,
  usedIndexes: [],
  viewType: 'tree',
};

describe('explain module', function () {
  describe('#switchToTreeView', function () {
    it('returns the SWITCHED_TO_TREE_VIEW action', function () {
      expect(switchToTreeView()).to.deep.equal({
        type: SWITCHED_TO_TREE_VIEW,
        viewType: 'tree',
      });
    });
  });

  describe('#switchToJSONView', function () {
    it('returns the SWITCHED_TO_JSON_VIEW action', function () {
      expect(switchToJSONView()).to.deep.equal({
        type: SWITCHED_TO_JSON_VIEW,
        viewType: 'json',
      });
    });
  });

  describe('#explainStateChanged', function () {
    it('returns the EXPLAIN_STATE_CHANGED action', function () {
      const expectedActions = {
        [explainStates.INITIAL]: {
          type: EXPLAIN_STATE_CHANGED,
          explainState: explainStates.INITIAL,
          abortController: null
        },
        [explainStates.REQUESTED]: {
          type: EXPLAIN_STATE_CHANGED,
          explainState: explainStates.REQUESTED,
          abortController: new AbortController()
        },
        [explainStates.EXECUTED]: {
          type: EXPLAIN_STATE_CHANGED,
          explainState: explainStates.EXECUTED,
          abortController: null
        },
        [explainStates.OUTDATED]: {
          type: EXPLAIN_STATE_CHANGED,
          explainState: explainStates.OUTDATED,
          abortController: null
        }
      };

      Object.keys(expectedActions).forEach((state) => {
        const expectedAction = expectedActions[state];
        expect(explainStateChanged(state, expectedAction.abortController)).to.deep.equal(expectedAction);
      })
    });
  });

  describe('#explainPlanFetched', function () {
    it('returns the EXPLAIN_PLAN_FETCHED action', function () {
      expect(explainPlanFetched(explainExample)).to.deep.equal({
        type: EXPLAIN_PLAN_FETCHED,
        explain: explainExample,
      });
    });
  });

  describe('#isAggregationExplainOutput', function () {
    context('with regular find explain output', function () {
      const basicFindExplainOutput = {
        explainVersion: '1',
        queryPlanner: {
          namespace: 'fruits.pineapple',
        },
        executionStats: {
          executionSuccess: true,
          executionStages: {
            stage: 'scan',
          },
        },
      };

      it('returns false', function () {
        expect(isAggregationExplainOutput(basicFindExplainOutput)).to.equal(
          false
        );
      });
    });

    context('with time series collection find explain output', function () {
      const basicFindExplainOutput = {
        explainVersion: '1',
        stages: [
          {
            $cursor: {
              executionStats: {
                executionSuccess: true,
                executionStages: {
                  stage: 'scan',
                },
              },
            },
          },
        ],
      };

      it('returns true', function () {
        expect(isAggregationExplainOutput(basicFindExplainOutput)).to.equal(
          true
        );
      });
    });
  });

  describe('#reducer', function () {
    context(
      'when the action is not presented in the explain module',
      function () {
        it('returns the default state', function () {
          const result = reducer(undefined, { type: 'test' });

          // resultId is a random number
          expect(result.resultId).to.be.a('number');

          expect(omit(result, 'resultId')).to.deep.equal({
            explainState: 'initial',
            viewType: 'tree',
            abortController: null,
            error: null,
            errorParsing: false,
            executionSuccess: false,
            executionTimeMillis: 0,
            inMemorySort: false,
            isCollectionScan: false,
            isCovered: false,
            isMultiKey: false,
            isSharded: false,
            indexType: 'UNAVAILABLE',
            index: null,
            nReturned: 0,
            namespace: '',
            numShards: 0,
            parsedQuery: {},
            executionStats: {},
            originalExplainData: {},
            totalDocsExamined: 0,
            totalKeysExamined: 0,
            usedIndexes: [],
          });
        });
      }
    );

    context('when the action is switchToTreeView', function () {
      it('returns the new state', function () {
        const explain = reducer(undefined, switchToTreeView());

        expect(explain.viewType).to.equal('tree');
      });
    });

    context('when the action is switchToJSONView', function () {
      it('returns the new state', function () {
        const explain = reducer(undefined, switchToJSONView());

        expect(explain.viewType).to.equal('json');
      });
    });

    context('when the action is explainStateChanged', function () {
      it('returns the new state', function () {
        const possibleExplainStates = ['initial', 'requested', 'executed', 'outdated'];
        possibleExplainStates.forEach((state) => {
          const explain = reducer(undefined, explainStateChanged(state));
          expect(explain.explainState).to.equal(state);
        });
      });
    });

    context('when the action is explainPlanFetched', function () {
      it('returns the new state', function () {
        const explain = reducer(undefined, explainPlanFetched(explainExample));

        expect(omit(explain, 'resultId')).to.deep.equal(explainExample);
      });
    });
  });
});
