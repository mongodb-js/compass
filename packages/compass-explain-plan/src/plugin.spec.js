import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import ExplainPlanPlugin from './plugin';
import configureStore from 'stores';
import AppRegistry from 'hadron-app-registry';

describe('ExplainPlan [Plugin]', () => {
  let component;
  let store;
  const appRegistry = new AppRegistry();

  class QueryBar extends React.Component {
    render() {
      return (<div id="queryBar">Query Bar</div>);
    }
  }

  beforeEach((done) => {
    appRegistry.registerRole('Query.QueryBar', {
      component: QueryBar,
      configureStore: () => {},
      configureActions: () => {}
    });
    store = configureStore({
      localAppRegistry: appRegistry
    });
    component = mount(<ExplainPlanPlugin store={store} />);
    done();
  });

  afterEach((done) => {
    component = null;
    store = null;
    done();
  });

  it('should contain a <Provider /> with a store prop', () => {
    expect(component.find(Provider).first().props('store')).to.be.an('object');
  });
});
