import React from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import { RadioBox } from '@leafygreen-ui/radio-box-group';
import { expect } from 'chai';

import { RadioBoxGroup } from './radio-box-group';
import { Toggle } from './toggle';

describe('RadioBoxGroup Component', function () {
  afterEach(cleanup);

  it('should render the radio box group', function () {
    render(
      <RadioBoxGroup onChange={() => {}}>
        <RadioBox value={123} key={123}>
          123
        </RadioBox>
        <RadioBox value="pineapple" key="pineapple">
          pineapple
        </RadioBox>
      </RadioBoxGroup>
    );

    expect(screen.getByText('pineapple')).to.be.visible;
  });

  it('should render a label when a label string is provided', function () {
    render(
      <RadioBoxGroup
        id="test"
        value="pineapple"
        onChange={() => {}}
        label="tortoises"
      >
        <RadioBox value={123} key={123}>
          123
        </RadioBox>
        <RadioBox value="pineapple" key="pineapple">
          pineapple
        </RadioBox>
      </RadioBoxGroup>
    );

    expect(screen.getByText('pineapple')).to.be.visible;
    expect(screen.getByText('tortoises')).to.be.visible;
    expect(screen.getByText('tortoises')).to.be.visible;
  });

  it('with a label component should render the label component', function () {
    render(
      <RadioBoxGroup
        id="test"
        value="pineapple"
        onChange={() => {}}
        label={
          <Toggle
            checked={false}
            onChange={() => {}}
            size="xsmall"
            label="test123"
            data-testid="test-label-component"
          >
            SSL/TLS Connection
          </Toggle>
        }
      >
        <RadioBox value={123} key={123}>
          123
        </RadioBox>
        <RadioBox value="pineapple" key="pineapple">
          pineapple
        </RadioBox>
      </RadioBoxGroup>
    );

    expect(screen.getByRole('switch')).to.be.visible;
    expect(screen.getByTestId('test-label-component')).to.be.visible;
    expect(screen.getByText('pineapple')).to.be.visible;
  });
});
