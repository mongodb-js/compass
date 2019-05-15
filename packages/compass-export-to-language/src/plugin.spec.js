import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import ExportToLanguagePlugin from './plugin';
import configureStore from 'stores';

describe('ExportToLanguage [Plugin]', () => {
  let component;
  let store;

  beforeEach((done) => {
    store = configureStore();
    component = mount(<ExportToLanguagePlugin store={store} />);
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
