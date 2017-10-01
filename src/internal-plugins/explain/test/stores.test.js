
/* eslint no-unused-expressions: 0 */
const expect = require('chai').expect;
const sinon = require('sinon');
const _ = require('lodash');
const path = require('path');
const ExplainPlanModel = require('mongodb-explain-plan-model');

const ExplainStore = require('../src/stores');
const TreeStagesStore = require('../src/stores/tree-stages');


function fetchExplainPlanFixture(file) {
  const fixtureData = require(path.join(__dirname, './fixtures/', file));
  const explainPlanModel = new ExplainPlanModel(fixtureData);
  const newState = explainPlanModel.serialize();
  newState.explainState = 'done';
  ExplainStore.setState(newState);
}


describe('ExplainStore', function() {
  context('reset store after each test', () => {
    afterEach(() => {
      // reset the store to initial values
      ExplainStore.setState(ExplainStore.getInitialState());
    });

    it('should have an initial state of {explainState: \'initial\'}', function() {
      expect(ExplainStore.state.explainState).to.be.equal('initial');
    });

    it('should initially have a viewType of `tree`', () => {
      expect(ExplainStore.state.viewType).to.be.equal('tree');
    });

    describe('switching the view type', function() {
      it('should switch viewType from `tree` to `json` and back', function() {
        expect(ExplainStore.state.viewType).to.be.equal('tree');
        ExplainStore.switchToJSONView();
        expect(ExplainStore.state.viewType).to.be.equal('json');
        ExplainStore.switchToTreeView();
        expect(ExplainStore.state.viewType).to.be.equal('tree');
      });
    });
  });
});

describe('TreeStagesStore', function() {
  afterEach(() => {
    // reset the store to initial values
    ExplainStore.setState(ExplainStore.getInitialState());
  });

  it('should initially have empty arrays for nodes and links', () => {
    expect(TreeStagesStore.state.nodes).to.be.deep.equal([]);
    expect(TreeStagesStore.state.links).to.be.deep.equal([]);
  });

  it('should initially have width and height of 0', () => {
    expect(TreeStagesStore.state.width).to.be.equal(0);
    expect(TreeStagesStore.state.height).to.be.equal(0);
  });

  context('spy on storeDidUpdate', () => {
    let spy;
    const originalStoreDidUpdate = TreeStagesStore.storeDidUpdate;
    beforeEach(() => {
      spy = sinon.spy();
      TreeStagesStore.storeDidUpdate = spy;
    });

    afterEach(() => {
      TreeStagesStore.storeDidUpdate = originalStoreDidUpdate;
    });

    it('should update when the ExplainStore updates', (done) => {
      fetchExplainPlanFixture('simple_collscan_3.2.json');
      setTimeout(() => {
        expect(spy.calledOnce).to.be.true;
        done();
      }, 1);
    });
  });

  context('simple collection scan', () => {
    it('it should have a single COLLSCAN stage', (done) => {
      const unsubscribe = TreeStagesStore.listen(function(store) {
        expect(store.nodes).to.have.lengthOf(1);
        expect(store.links).to.have.lengthOf(0);
        unsubscribe();
        done();
      });
      fetchExplainPlanFixture('simple_collscan_3.2.json');
    });

    it('it should have a width and height larger than 0', (done) => {
      const unsubscribe = TreeStagesStore.listen(function(store) {
        expect(store.width).to.be.above(0);
        expect(store.height).to.be.above(0);
        unsubscribe();
        done();
      });
      fetchExplainPlanFixture('simple_collscan_3.2.json');
    });
  });

  context('simple index', () => {
    it('it should have a a IXSCAN and FETCH stage', (done) => {
      const unsubscribe = TreeStagesStore.listen(function(store) {
        expect(store.nodes).to.have.lengthOf(2);
        expect(_.map(store.nodes, 'name')).to.be.deep.equal(['FETCH', 'IXSCAN']);
        expect(store.links).to.have.lengthOf(1);
        unsubscribe();
        done();
      });
      fetchExplainPlanFixture('simple_index_3.2.json');
    });
  });
});
