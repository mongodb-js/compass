import reducer, {
  treeStagesChanged,
  TREE_STAGES_CHANGED
} from 'modules/tree-stages';

const explainExample = {
  error: null,
  executionSuccess: true,
  executionTimeMillis: 6,
  explainState: 'done',
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
  usedIndex: null,
  viewType: 'tree'
};

describe('tree-stages module', () => {
  describe('#treeStagesChanged', () => {
    it('returns the TREE_STAGES_CHANGED action', () => {
      expect(treeStagesChanged(explainExample)).to.deep.equal({
        type: TREE_STAGES_CHANGED,
        explain: explainExample
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not presented in the tree-stages module', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          nodes: [],
          links: [],
          width: 0,
          height: 0
        });
      });
    });

    context('when the action is treeStagesChanged', () => {
      it('returns the new state', () => {
        const treeStages = reducer(undefined, treeStagesChanged(explainExample));

        expect(treeStages).to.deep.equal({
          nodes: [],
          links: [],
          width: 0,
          height: 0
        });
      });
    });
  });
});
