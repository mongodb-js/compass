import React from 'react';
import { shallow } from 'enzyme';
import { StoreConnector } from 'hadron-react-components';
import QueryBarPlugin from './plugin';

describe('QueryBar [Plugin]', () => {
  let component;

  beforeEach(function() {
    component = shallow(<QueryBarPlugin />);
  });

  afterEach(function() {
    component = null;
  });

  it('should contain a <StoreConnector /> with a store prop', function() {
    expect(component.find(StoreConnector).first().props('store')).to.be.an('object');
  });
});
