import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import DocumentStatsItem from '../document-stats-item';

describe('DocumentStatsItem [Component]', function () {
  afterEach(cleanup);

  beforeEach(function () {
    render(<DocumentStatsItem documentCount="10" />);
  });

  it('renders the correct root classname', function () {
    expect(screen.getByTestId('document-stats-item')).to.exist;
  });

  it('renders the document count value', function () {
    const value = screen.getByTestId('document-count-value');
    expect(value).to.have.text('10');
    expect(value).to.be.visible;
  });

  it('renders the document count label', function () {
    const label = screen.getByTestId('document-count-label');
    expect(label).to.have.text('Documents');
    expect(label).to.be.visible;
  });
});
