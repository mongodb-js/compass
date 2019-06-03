import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import IndexesPlugin from './plugin';
import configureStore from 'stores';
import AppRegistry from 'hadron-app-registry';

describe('Indexes [Plugin]', () => {
  let component;
  let store;

  beforeEach((done) => {
    store = configureStore({
      localAppRegistry: new AppRegistry()
    });
    component = mount(<IndexesPlugin store={store} />);
    done();
  });

  afterEach((done) => {
    store = null;
    component = null;
    done();
  });

  it('should contain a <Provider /> with a store prop', () => {
    expect(component.find(Provider).first().props('store')).to.be.an('object');
  });
});
