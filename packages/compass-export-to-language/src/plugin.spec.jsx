import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { expect } from 'chai';
import ExportToLanguagePlugin from './plugin';
import configureStore from './stores';

describe('ExportToLanguage [Plugin]', function () {
  let component;
  let store;

  beforeEach(function (done) {
    store = configureStore();
    component = mount(<ExportToLanguagePlugin store={store} />);
    done();
  });

  afterEach(function (done) {
    component = null;
    store = null;
    done();
  });

  it('should contain a <Provider /> with a store prop', function () {
    expect(component.find(Provider).first().props('store')).to.be.an('object');
  });
});
