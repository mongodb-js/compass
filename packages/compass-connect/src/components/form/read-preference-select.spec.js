import React from 'react';
import { mount } from 'enzyme';
import ReadPreferenceSelect from './read-preference-select';

describe('ReadPreferenceSelect [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<ReadPreferenceSelect readPreference="secondary" />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the read preference', () => {
    expect(component.find('select')).to.have.value('secondary');
  });
});
