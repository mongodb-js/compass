import React from 'react';
import { mount } from 'enzyme';
import HostInput from './host-input';

describe('HostInput [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<HostInput hostname="127.0.0.1"/>);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the hostname', () => {
    expect(component.find('input[name="hostname"]')).to.have.value('127.0.0.1');
  });

  it('renders the hostname placeholder', () => {
    const hostname = component.find('input[name="hostname"]').prop('placeholder');

    expect(hostname).to.equal('localhost');
  });
});
