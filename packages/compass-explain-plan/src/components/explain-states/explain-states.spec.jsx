import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';
import sinon from 'sinon';
import { expect } from 'chai';

import ExplainStates from '../explain-states';
import styles from './explain-states.module.less';

describe('ExplainStates [Component]', function () {
  let component;
  const appRegistry = new AppRegistry();

  class QueryBar extends React.Component {
    render() {
      return <div id="queryBar">Query Bar</div>;
    }
  }

  const isEditable = false;
  const explain = {
    viewType: 'tree',
    nReturned: 0,
    totalKeysExamined: 0,
    totalDocsExamined: 0,
    executionTimeMillis: 0,
    inMemorySort: false,
    indexType: 'UNAVAILABLE',
    index: null,
    explainState: 'initial',
  };
  const fetchExplainPlanSpy = sinon.spy();
  const changeExplainPlanStateSpy = sinon.spy();
  const switchToTreeViewSpy = sinon.spy();
  const switchToJSONViewSpy = sinon.spy();
  const queryExecuted = sinon.spy();
  const query = {};
  const treeStages = {};

  beforeEach(function () {
    appRegistry.registerRole('Query.QueryBar', {
      component: QueryBar,
      configureStore: () => {},
      configureActions: () => {},
    });
    component = mount(
      <ExplainStates
        explain={explain}
        fetchExplainPlan={fetchExplainPlanSpy}
        changeExplainPlanState={changeExplainPlanStateSpy}
        switchToTreeView={switchToTreeViewSpy}
        switchToJSONView={switchToJSONViewSpy}
        query={query}
        appRegistry={{ localAppRegistry: appRegistry }}
        isEditable={isEditable}
        treeStages={treeStages}
        queryExecuted={queryExecuted}
      />
    );
  });

  afterEach(function () {
    component = null;
  });

  it('renders the wrapper div', function () {
    expect(component.find(`.${styles['controls-container']}`)).to.be.present();
  });

  it('renders the read only banner', function () {
    expect(component.find('StatusRow')).to.be.present();
  });
});
