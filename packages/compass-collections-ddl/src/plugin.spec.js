import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import DdlPlugin from './plugin';

describe('Ddl [Plugin]', () => {
  let component;

  beforeEach((done) => {
    component = mount(<DdlPlugin />);
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
