import reducer, {
  switchToTreeView,
  switchToJSONView,
  explainStateChanged,
  explainPlanFetched,
  SWITCHED_TO_TREE_VIEW,
  SWITCHED_TO_JSON_VIEW,
  EXPLAIN_STATE_CHANGED,
  EXPLAIN_PLAN_FETCHED

} from 'modules/explain';

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
  usedIndex: null,
  viewType: 'tree'
};

describe('explain module', () => {
  describe('#switchToTreeView', () => {
    it('returns the SWITCHED_TO_TREE_VIEW action', () => {
      expect(switchToTreeView()).to.deep.equal({
        type: SWITCHED_TO_TREE_VIEW,
        viewType: 'tree'
      });
    });
  });

  describe('#switchToJSONView', () => {
    it('returns the SWITCHED_TO_JSON_VIEW action', () => {
      expect(switchToJSONView()).to.deep.equal({
        type: SWITCHED_TO_JSON_VIEW,
        viewType: 'json'
      });
    });
  });

  describe('#explainStateChanged', () => {
    it('returns the EXPLAIN_STATE_CHANGED action', () => {
      expect(explainStateChanged('executed')).to.deep.equal({
        type: EXPLAIN_STATE_CHANGED,
        explainState: 'executed'
      });
    });
  });

  describe('#explainPlanFetched', () => {
    it('returns the EXPLAIN_PLAN_FETCHED action', () => {
      expect(explainPlanFetched(explainExample)).to.deep.equal({
        type: EXPLAIN_PLAN_FETCHED,
        explain: explainExample
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not presented in the explain module', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          explainState: 'initial',
          viewType: 'tree',
          error: null,
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
          rawExplainObject: {},
          totalDocsExamined: 0,
          totalKeysExamined: 0,
          usedIndex: null
        });
      });
    });

    context('when the action is switchToTreeView', () => {
      it('returns the new state', () => {
        const explain = reducer(undefined, switchToTreeView());

        expect(explain.viewType).to.equal('tree');
      });
    });

    context('when the action is switchToJSONView', () => {
      it('returns the new state', () => {
        const explain = reducer(undefined, switchToJSONView());

        expect(explain.viewType).to.equal('json');
      });
    });

    context('when the action is explainStateChanged', () => {
      it('returns the new state', () => {
        const explain = reducer(undefined, explainStateChanged('initial'));

        expect(explain.explainState).to.equal('initial');
      });
    });

    context('when the action is explainPlanFetched', () => {
      it('returns the new state', () => {
        const explain = reducer(undefined, explainPlanFetched(explainExample));

        expect(explain).to.deep.equal(explainExample);
      });
    });
  });
});
