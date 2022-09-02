import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';

import IndexesPlugin from './plugin';
import configureStore from './stores';

const appInstanceStoreMock = {
  getState: function () {
    return {
      instance: {
        on: () => {},
        description: null,
        isWritable: null,
      },
    };
  },
};

describe('Indexes [Plugin]', function () {
  let component;
  let store;

  beforeEach(function (done) {
    const globalAppRegistry = new AppRegistry();
    globalAppRegistry.registerStore('App.InstanceStore', appInstanceStoreMock);

    store = configureStore({
      localAppRegistry: new AppRegistry(),
      globalAppRegistry,
    });
    component = mount(<IndexesPlugin store={store} />);
    done();
  });

  afterEach(function (done) {
    store = null;
    component = null;
    done();
  });

  it('should contain a <Provider /> with a store prop', function () {
    expect(component.find(Provider).first().props('store')).to.be.an('object');
  });
});
