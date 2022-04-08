import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import IndexStatsItem from '../index-stats-item';

describe('IndexStatsItem [Component]', function () {
  afterEach(cleanup);

  beforeEach(function () {
    render(<IndexStatsItem indexCount="10" />);
  });

  it('renders the correct root classname', function () {
    expect(screen.getByTestId('index-stats-item')).to.exist;
  });

  it('renders the document count value', function () {
    const value = screen.getByTestId('index-count-value');
    expect(value).to.have.text('10');
    expect(value).to.be.visible;
  });

  it('renders the document count label', function () {
    const label = screen.getByTestId('index-count-label');
    expect(label).to.have.text('Indexes');
    expect(label).to.be.visible;
  });
});
