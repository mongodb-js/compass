import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';

import SizeField from './size-field';

describe('SizeField Component', function () {
  before(cleanup);
  afterEach(cleanup);
  it('renders size - less than 1000', function () {
    render(<SizeField size={20} relativeSize={15} />);
    expect(screen.getByText(/20 b/i)).to.exist;
    // todo: tooltip tests
  });

  it('renders size - greater than 1000', function () {
    render(<SizeField size={2000} relativeSize={1500} />);
    expect(screen.getByText(/2.0 kb/i)).to.exist;
    // todo: tooltip tests
  });
});
