import { mount } from 'enzyme';
import React from 'react';

import PortInput from './port-input';

describe('PortInput [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<PortInput port="27018" />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the port', () => {
    expect(component.find('input[name="port"]')).to.have.value('27018');
    expect(component.find('input[name="port"]').prop('type')).to.equal('number');
  });

  it('renders the port placeholder', () => {
    expect(component.find('input[name="port"]').prop('placeholder')).to.equal('27017');
  });
});
