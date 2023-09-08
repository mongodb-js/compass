import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';

import IndexesPlugin from './plugin';
import configureStore from './stores';

describe('Indexes [Plugin]', function () {
  let component;
  let store;

  beforeEach(function (done) {
    store = configureStore({
      localAppRegistry: new AppRegistry(),
      dataProvider: {
        dataProvider: {
          isConnected: () => true,
        },
      },
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
