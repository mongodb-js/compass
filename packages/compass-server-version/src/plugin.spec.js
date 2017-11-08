import React from 'react';
import { mount } from 'enzyme';
import { StoreConnector } from 'hadron-react-components';
import ServerVersionPlugin from './plugin';

describe('ServerVersion [Plugin]', () => {
  let component;

  beforeEach(() => {
    component = mount(<ServerVersionPlugin />);
  });

  afterEach(() => {
    component = null;
  });

  it('should contain a <StoreConnector /> with a store prop', () => {
    expect(component.find(StoreConnector).first().props('store')).to.be.an('object');
  });
});
