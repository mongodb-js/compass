import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';
import sinon from 'sinon';
import { expect } from 'chai';
import { Banner, EmptyContent } from '@mongodb-js/compass-components';

import ExplainStates from '../explain-states';
import ExplainBody from '../explain-body';

class MockQueryBarComponent extends React.Component {
  render() {
    return <div id="queryBar">Query Bar</div>;
  }
}

describe('ExplainStates [Component]', function () {
  let component;
  const appRegistry = new AppRegistry();

  const isEditable = false;
  const explain = {
    viewType: 'tree',
    nReturned: 0,
    totalKeysExamined: 0,
    totalDocsExamined: 0,
    executionTimeMillis: 0,
    inMemorySort: false,
    originalExplainData: {},
    indexType: 'UNAVAILABLE',
    index: null,
    explainState: 'initial',
  };
  const fetchExplainPlanSpy = sinon.spy();
  const cancelExplainPlan = sinon.spy();
  const switchToTreeViewSpy = sinon.spy();
  const switchToJSONViewSpy = sinon.spy();
  const queryExecuted = sinon.spy();
  const query = {};

  const mountExplainStates = (props) =>
    mount(
      <ExplainStates
        explain={explain}
        fetchExplainPlan={fetchExplainPlanSpy}
        cancelExplainPlan={cancelExplainPlan}
        switchToTreeView={switchToTreeViewSpy}
        switchToJSONView={switchToJSONViewSpy}
        query={query}
        appRegistry={{ localAppRegistry: appRegistry }}
        isEditable={isEditable}
        queryExecuted={queryExecuted}
        {...props}
      />
    );

  beforeEach(function () {
    appRegistry.registerRole('Query.QueryBar', {
      component: MockQueryBarComponent,
      configureStore: () => {},
      configureActions: () => {},
    });
    component = mountExplainStates();
  });

  afterEach(function () {
    component.unmount();
    component = null;
  });

  it('renders the read only banner', function () {
    expect(component.find(Banner)).to.be.present();
  });

  it('renders the query bar', function () {
    expect(component.find(MockQueryBarComponent)).to.be.present();
  });

  it('renders a zero state when component is rendered for the first time', function () {
    component = mountExplainStates({
      explain: {
        ...explain,
        isEditable: true,
      },
    });
    expect(component.find(EmptyContent)).to.be.present();
  });

  it('renders a loading state when explain is requested', function () {
    component = mountExplainStates({
      explain: {
        ...explain,
        isEditable: true,
        explainState: 'requested',
      },
    });
    expect(
      component.find(`[data-testid="query-explain-cancel"]`)
    ).to.be.present();
  });

  it('renders a explain body post execution of explain plan', function () {
    component = mountExplainStates({
      explain: {
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
      },
      isEditable: true,
    });
    expect(component.find(ExplainBody)).to.be.present();
  });
});
