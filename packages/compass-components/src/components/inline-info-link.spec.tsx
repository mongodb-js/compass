import React from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import { expect } from 'chai';

import { InlineInfoLink } from './inline-info-link';

describe('InlineInfoLink Component', function () {
  afterEach(cleanup);

  it('should render the info button link', function () {
    render(<InlineInfoLink href="mangoes" aria-label="link label" />);

    expect(screen.getByRole('link')).to.be.visible;
  });

  it('the info button should have the correct link', function () {
    render(<InlineInfoLink href="mangoes" aria-label="link label" />);

    expect(screen.getByRole('link').getAttribute('href')).to.equal('mangoes');
  });

  it('the info button should have the arialabel', function () {
    render(<InlineInfoLink href="mangoes" aria-label="more info" />);

    expect(screen.getByLabelText('more info')).to.be.visible;
  });
});
