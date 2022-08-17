import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';

import UsageField from './usage-field';

describe('UsageField Component', function () {
  before(cleanup);
  afterEach(cleanup);
  it('renders usage', function () {
    const since = new Date();
    render(<UsageField usage={20} since={since} />);

    const renderedText = `20 (since ${since.toDateString()})`;
    expect(screen.getByText(renderedText)).to.exist;
    // todo: tooltip tests
  });

  it('renders zero when usage is not defined', function () {
    const since = new Date();
    render(<UsageField since={since} />);

    const renderedText = `0 (since ${since.toDateString()})`;
    expect(screen.getByText(renderedText)).to.exist;
    // todo: tooltip tests
  });

  it('renders N/A when since is not defined', function () {
    render(<UsageField usage={30} />);
    const renderedText = '30 (N/A)';
    expect(screen.getByText(renderedText)).to.exist;
    // todo: tooltip tests
  });
});
