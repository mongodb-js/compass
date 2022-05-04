import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';

import ExplainPlan from '../explain-plan';
import configureStore from '../../stores';
import styles from './explain-plan.module.less';

describe('ExplainPlan [Component]', function () {
  let component;
  let store;
  const appRegistry = new AppRegistry();

  class QueryBar extends React.Component {
    render() {
      return <div id="queryBar">Query Bar</div>;
    }
  }

  beforeEach(function () {
    appRegistry.registerRole('Query.QueryBar', {
      component: QueryBar,
      configureStore: () => {},
      configureActions: () => {},
    });
    store = configureStore({ localAppRegistry: appRegistry });
    component = mount(<ExplainPlan store={store} />);
  });

  afterEach(function () {
    store = null;
    component = null;
  });

  it('renders the correct root classname', function () {
    expect(component.find(`.${styles.root}`)).to.be.present();
  });
});
