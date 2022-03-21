import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import IndexStatsItem from '../index-stats-item';

describe('IndexStatsItem [Component]', function () {
  afterEach(cleanup);

  beforeEach(function () {
    render(
      <IndexStatsItem indexCount="10" totalIndexSize="5kb" avgIndexSize="1k" />
    );
  });

  it('renders the correct root classname', function () {
    expect(screen.getByTestId('index-stats-item')).to.exist;
  });

  it('renders the count as primary', function () {
    const label = screen.getByTestId(
      'index-count-label-primary'
    );
    expect(label).to.have.text('Indexes');
    expect(label).to.be.visible;
  });

  it('renders the count as primary value', function () {
    const value = screen.getByTestId(
      'index-count-value-primary'
    );
    expect(value).to.have.text('10');
    expect(value).to.be.visible;
  });

  it('renders total index size as non primary label', function () {
    const label = screen.getByTestId(
      'total-index-size-label'
    );
    expect(label).to.have.text('total size');
    expect(label).to.be.visible;
  });

  it('renders total index size as non primary value', function () {
    const value = screen.getByTestId(
      'total-index-size-value'
    );
    expect(value).to.have.text('5kb');
    expect(value).to.be.visible;
  });

  it('renders avg index size as a non primary label', function () {
    const label = screen.getByTestId(
      'avg-index-size-label'
    );
    expect(label).to.have.text('avg. size');
    expect(label).to.be.visible;
  });

  it('renders avg index size as a non primary value', function () {
    const value = screen.getByTestId(
      'avg-index-size-value'
    );
    expect(value).to.have.text('1k');
    expect(value).to.be.visible;
  });
});
