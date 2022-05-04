import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';

import ExplainPlanPlugin from './plugin';
import configureStore from './stores';

describe('ExplainPlan [Plugin]', function() {
  let component;
  let store;
  const appRegistry = new AppRegistry();

  class QueryBar extends React.Component {
    render() {
      return (<div id="queryBar">Query Bar</div>);
    }
  }

  beforeEach(function(done) {
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

  afterEach(function(done) {
    component = null;
    store = null;
    done();
  });

  it('should contain a <Provider /> with a store prop', function() {
    expect(component.find(Provider).first().props('store')).to.be.an('object');
  });
});
