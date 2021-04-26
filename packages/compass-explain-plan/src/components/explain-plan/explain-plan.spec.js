import React from 'react';
import { mount } from 'enzyme';
import ExplainPlan from 'components/explain-plan';
import configureStore from 'stores';
import styles from './explain-plan.less';
import AppRegistry from 'hadron-app-registry';

describe('ExplainPlan [Component]', () => {
  let component;
  let store;
  const appRegistry = new AppRegistry();

  class QueryBar extends React.Component {
    render() {
      return (<div id="queryBar">Query Bar</div>);
    }
  }

  beforeEach(() => {
    appRegistry.registerRole('Query.QueryBar', {
      component: QueryBar,
      configureStore: () => {},
      configureActions: () => {}
    });
    store = configureStore({ localAppRegistry: appRegistry });
    component = mount(<ExplainPlan store={store} />);
  });

  afterEach(() => {
    store = null;
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.root}`)).to.be.present();
  });
});
