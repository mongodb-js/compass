import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import CompassSchemaPlugin from './plugin';

describe('CompassSchema [Plugin]', () => {
  let component;

  beforeEach((done) => {
    component = mount(<CompassSchemaPlugin />);
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
