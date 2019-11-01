import React from 'react';
import { mount } from 'enzyme';
import ExplainStates from 'components/explain-states';
import styles from './explain-states.less';
import AppRegistry from 'hadron-app-registry';

describe('ExplainStates [Component]', () => {
  let component;
  const appRegistry = new AppRegistry();

  class QueryBar extends React.Component {
    render() {
      return (<div id="queryBar">Query Bar</div>);
    }
  }

  const isEditable = false;
  const openLinkSpy = sinon.spy();
  const explain = {
    viewType: 'tree',
    rawExplainObject: {},
    nReturned: 0,
    totalKeysExamined: 0,
    totalDocsExamined: 0,
    executionTimeMillis: 0,
    inMemorySort: false,
    indexType: 'UNAVAILABLE',
    index: null,
    explainState: 'initial'
  };
  const fetchExplainPlanSpy = sinon.spy();
  const changeExplainPlanStateSpy = sinon.spy();
  const switchToTreeViewSpy = sinon.spy();
  const switchToJSONViewSpy = sinon.spy();
  const queryExecuted = sinon.spy();
  const query = {};
  const treeStages = {};

  beforeEach(() => {
    appRegistry.registerRole('Query.QueryBar', {
      component: QueryBar,
      configureStore: () => {},
      configureActions: () => {}
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
        openLink={openLinkSpy}
        treeStages={treeStages}
        queryExecuted={queryExecuted} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['controls-container']}`)).to.be.present();
  });

  it('renders the read only banner', () => {
    expect(component.find('StatusRow')).to.be.present();
  });
});
