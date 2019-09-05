import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import LoadingPlugin from './plugin';
import configureStore from 'stores';

describe('Loading [Plugin]', () => {
  let component;

  beforeEach((done) => {
    component = mount(<LoadingPlugin store={configureStore()} />);
    done();
  });

  afterEach((done) => {
    component = null;
    done();
  });

  it('should contain a <Provider /> with a store prop', () => {
    expect(component.find(Provider).first().props('store')).to.be.an('object');
  });
});
