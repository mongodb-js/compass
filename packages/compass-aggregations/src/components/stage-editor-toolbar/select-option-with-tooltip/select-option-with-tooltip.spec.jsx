import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import { Tooltip } from 'hadron-react-components';
import { Option } from 'react-select-plus';

import SelectOptionWithTooltip from './select-option-with-tooltip';

describe('SelectOptionWithTooltip [Component]', function() {
  let component;

  beforeEach(function() {
    component = mount(
      <SelectOptionWithTooltip
        option={{
          value: 'a',
          label: 'a'
        }}
      />
    );
  });

  afterEach(function() {
    component = null;
  });

  it('renders the tooltip', function() {
    expect(component.find(Tooltip)).to.be.present();
  });

  it('renders the react-select-plus option', function() {
    expect(component.find(Option)).to.be.present();
  });
});
