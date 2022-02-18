import React from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import { expect } from 'chai';

import { LabelWithInfo } from './label-with-info';

describe('LabelWithInfo Component', function () {
  afterEach(cleanup);

  it('should render the label and an info button', function () {
    render(
      <LabelWithInfo htmlFor="123" href="mangoes" aria-label="link label">
        pineapple
      </LabelWithInfo>
    );

    expect(screen.getByText('pineapple')).to.be.visible;
    expect(screen.getByRole('link').getAttribute('href')).to.equal('mangoes');
  });
});
