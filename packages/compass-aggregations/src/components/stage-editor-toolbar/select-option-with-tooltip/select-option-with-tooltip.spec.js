import React from 'react';
import { mount } from 'enzyme';
import { Tooltip } from 'hadron-react-components';
import { Option } from 'react-select-plus';

import SelectOptionWithTooltip from './select-option-with-tooltip';

describe('SelectOptionWithTooltip [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(
      <SelectOptionWithTooltip
        option={{
          value: 'a',
          label: 'a'
        }}
      />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the tooltip', () => {
    expect(component.find(Tooltip)).to.be.present();
  });

  it('renders the react-select-plus option', () => {
    expect(component.find(Option)).to.be.present();
  });
});
