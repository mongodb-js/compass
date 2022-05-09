import { expect } from 'chai';

import reducer, { treeStagesChanged, TREE_STAGES_CHANGED } from './tree-stages';

const explainExample = {
  error: null,
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
  rawExplainObject: {},
  totalDocsExamined: 18801,
  totalKeysExamined: 0,
  usedIndexes: [],
  viewType: 'tree',
};

describe('tree-stages module', function () {
  describe('#treeStagesChanged', function () {
    it('returns the TREE_STAGES_CHANGED action', function () {
      expect(treeStagesChanged(explainExample)).to.deep.equal({
        type: TREE_STAGES_CHANGED,
        explain: explainExample,
      });
    });
  });

  describe('#reducer', function () {
    context(
      'when the action is not presented in the tree-stages module',
      function () {
        it('returns the default state', function () {
          expect(reducer(undefined, { type: 'test' })).to.deep.equal({
            nodes: [],
            links: [],
            width: 0,
            height: 0,
          });
        });
      }
    );

    context('when the action is treeStagesChanged', function () {
      it('returns the new state', function () {
        const treeStages = reducer(
          undefined,
          treeStagesChanged(explainExample)
        );

        expect(treeStages).to.deep.equal({
          nodes: [],
          links: [],
          width: 0,
          height: 0,
        });
      });
    });
  });
});
